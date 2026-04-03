import { catchAsync } from '../middlewares/errorMiddleware.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import { HttpStatus } from '../utils/httpStatus.js';
import AppError from '../utils/AppError.js';
import sendEmail from '../utils/sendEmail.js';

const USD_TO_VND_RATE = Number(process.env.SEPAY_USD_TO_VND_RATE || 25000);
const OBJECT_ID_REGEX = /[a-f\d]{24}/i;
const DEFAULT_SEPAY_PAYMENT_PREFIX = 'RMR';

const toFiniteNumber = (value, fallback = 0) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return fallback;
	}
	return parsed;
};

const normalizeUsdAmountFromVnd = (rawVndAmount, expectedUsd = 0) => {
	const parsedRaw = toFiniteNumber(rawVndAmount, 0);
	if (parsedRaw <= 0) {
		return 0;
	}

	const directCandidate = parsedRaw / USD_TO_VND_RATE;

	if (Number.isFinite(expectedUsd) && expectedUsd > 0) {
		return Number((Math.abs(directCandidate - expectedUsd) < 0.5
			? expectedUsd
			: directCandidate).toFixed(2));
	}

	return Number(directCandidate.toFixed(2));
};

const normalizeStoredPaymentAmount = (storedAmount, expectedUsd = 0) => {
	const parsedStored = Number(storedAmount || 0);
	if (!Number.isFinite(parsedStored) || parsedStored <= 0) {
		return 0;
	}

	if (Number.isFinite(expectedUsd) && expectedUsd > 0) {
		const ratio = parsedStored / expectedUsd;
		if (ratio > 99 && ratio < 101) {
			return Number((parsedStored / 100).toFixed(2));
		}
	}

	return Number(parsedStored.toFixed(2));
};

const getSepayConfig = () => ({
	bankCode: String(process.env.SEPAY_BANK_CODE || '').trim(),
	accountNumber: String(process.env.SEPAY_ACCOUNT_NUMBER || '').trim(),
	accountName: String(process.env.SEPAY_ACCOUNT_NAME || '').trim(),
	qrTemplate: String(process.env.SEPAY_QR_TEMPLATE || 'compact').trim(),
	qrBaseUrl: String(process.env.SEPAY_QR_BASE_URL || 'https://qr.sepay.vn').trim(),
	webhookApiKey: String(process.env.SEPAY_WEBHOOK_API_KEY || '').trim(),
	paymentPrefix: String(process.env.SEPAY_PAYMENT_PREFIX || DEFAULT_SEPAY_PAYMENT_PREFIX)
		.trim()
		.toUpperCase(),
	clientUrl: String(process.env.CLIENT_URL || 'http://localhost:3000').trim(),
	amountToleranceVnd: toFiniteNumber(process.env.SEPAY_AMOUNT_TOLERANCE_VND, 1000),
});

const ensureSepayCheckoutConfig = (sepayConfig) => {
	if (!sepayConfig.bankCode || !sepayConfig.accountNumber || !sepayConfig.accountName) {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			'SePay is not configured yet. Missing bank account information.',
		);
	}
};

const buildSepayPaymentCode = (bookingId, paymentPrefix) =>
	`${paymentPrefix}${String(bookingId).toUpperCase()}`;

const buildSepayQrUrl = ({
	qrBaseUrl,
	bankCode,
	accountNumber,
	amountVnd,
	paymentCode,
	qrTemplate,
}) => {
	const qrUrl = new URL('/img', qrBaseUrl.endsWith('/') ? qrBaseUrl : `${qrBaseUrl}/`);
	qrUrl.searchParams.set('acc', accountNumber);
	qrUrl.searchParams.set('bank', bankCode);
	qrUrl.searchParams.set('amount', String(Math.round(amountVnd)));
	qrUrl.searchParams.set('des', paymentCode);
	qrUrl.searchParams.set('template', qrTemplate || 'compact');
	return qrUrl.toString();
};

const parseSepayTransactionDate = (value) => {
	if (!value) {
		return new Date();
	}

	const normalized = String(value).trim().replace(' ', 'T');
	const parsed = new Date(normalized);
	if (Number.isNaN(parsed.getTime())) {
		return new Date();
	}

	return parsed;
};

const parseBookingIdFromSepayPayload = (payload = {}) => {
	const candidates = [payload.code, payload.content, payload.description]
		.filter(Boolean)
		.map((value) => String(value));

	for (const candidate of candidates) {
		const matched = candidate.match(OBJECT_ID_REGEX);
		if (matched) {
			return matched[0];
		}
	}

	return null;
};

const buildCheckoutData = ({ booking, paymentCode, sepayConfig }) => {
	const amountUsd = Number(booking.totalAmount || 0);
	const amountVnd = Math.round(amountUsd * USD_TO_VND_RATE);
	const qrCodeUrl = buildSepayQrUrl({
		qrBaseUrl: sepayConfig.qrBaseUrl,
		bankCode: sepayConfig.bankCode,
		accountNumber: sepayConfig.accountNumber,
		amountVnd,
		paymentCode,
		qrTemplate: sepayConfig.qrTemplate,
	});

	return {
		gateway: 'sepay',
		bookingId: booking._id,
		bookingStatus: booking.status,
		paymentCode,
		amountUsd: Number(amountUsd.toFixed(2)),
		amountVnd,
		bankCode: sepayConfig.bankCode,
		accountNumber: sepayConfig.accountNumber,
		accountName: sepayConfig.accountName,
		qrCodeUrl,
		expiresAt: booking.expiresAt,
	};
};

const mapPaymentState = ({ booking, payment }) => {
	if (
		payment?.status === 'confirmed' ||
		booking.status === 'paid' ||
		booking.status === 'confirmed'
	) {
		return 'confirmed';
	}

	if (
		payment?.status === 'cancel' ||
		booking.status === 'cancelled' ||
		booking.status === 'expired'
	) {
		return 'failed';
	}

	return 'pending';
};

const assertBookingCanPay = (booking) => {
	if (booking.status === 'expired' || booking.status === 'cancelled') {
		throw new AppError(
			HttpStatus.BAD_REQUEST,
			'Booking is no longer valid for payment',
		);
	}

	if (booking.status === 'confirmed' || booking.status === 'paid') {
		throw new AppError(HttpStatus.BAD_REQUEST, 'Booking is already paid');
	}
};

const upsertPendingPayment = async ({ booking, paymentCode, amountUsd }) => {
	const existingPayment = await Payment.findOne({ bookingId: booking._id });

	if (!existingPayment) {
		await Payment.create({
			bookingId: booking._id,
			amount: amountUsd,
			status: 'pending',
			paymentMethod: 'sepay',
			paymentCode,
		});
		return;
	}

	if (existingPayment.status !== 'confirmed') {
		existingPayment.amount = amountUsd;
		existingPayment.status = 'pending';
		existingPayment.paymentMethod = 'sepay';
		existingPayment.paymentCode = paymentCode;
		await existingPayment.save();
	}
};

// @desc    Get all payments
// @route   GET /api/v1/payments
const getPayments = catchAsync(async (req, res) => {
	const { hotelId, status, startDate, endDate, minPrice, maxPrice } = req.query;
	const paymentFilter = {};

	if (status && status !== 'all') {
		paymentFilter.status = status;
	}

	if (startDate || endDate) {
		paymentFilter.paymentDate = {};
		if (startDate) {
			paymentFilter.paymentDate.$gte = new Date(startDate);
		}
		if (endDate) {
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			paymentFilter.paymentDate.$lte = end;
		}
	}

	if (minPrice !== undefined || maxPrice !== undefined) {
		paymentFilter.amount = {};
		if (minPrice !== undefined && minPrice !== '') {
			paymentFilter.amount.$gte = Number(minPrice);
		}
		if (maxPrice !== undefined && maxPrice !== '') {
			paymentFilter.amount.$lte = Number(maxPrice);
		}
	}

	if (req.user?.role === 'staff') {
		const bookingIds = await Booking.find({ hotelId: req.user.hotelId }).distinct('_id');
		paymentFilter.bookingId = { $in: bookingIds };
	} else if (hotelId && hotelId !== 'all') {
		const bookingIds = await Booking.find({ hotelId }).distinct('_id');
		paymentFilter.bookingId = { $in: bookingIds };
	}

	const payments = await Payment.find(paymentFilter)
		.populate({
			path: 'bookingId',
			select: 'totalAmount userId hotelId',
			populate: [
				{ path: 'userId', select: 'fullName' },
				{ path: 'hotelId', select: 'name status' },
			],
		})
		.sort({ paymentDate: -1 });

	const paymentFixOps = [];
	const normalizedPayments = payments.map((payment) => {
		const bookingTotalAmount = Number(payment.bookingId?.totalAmount || 0);
		const normalizedAmount = normalizeStoredPaymentAmount(
			payment.amount,
			bookingTotalAmount,
		);

		if (
			payment.status === 'confirmed' &&
			Math.abs(Number(payment.amount || 0) - normalizedAmount) > 0.01
		) {
			paymentFixOps.push({
				updateOne: {
					filter: { _id: payment._id },
					update: { $set: { amount: normalizedAmount } },
				},
			});
		}

		const paymentObj = payment.toObject();
		paymentObj.amount = normalizedAmount;
		return paymentObj;
	});

	if (paymentFixOps.length > 0) {
		await Payment.bulkWrite(paymentFixOps);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		data: normalizedPayments,
	});
});

// @desc    Get payment by booking ID
// @route   GET /api/v1/payments/booking/:bookingId
const getPaymentByBookingId = catchAsync(async (req, res) => {
	const { bookingId } = req.params;
	const booking = await Booking.findById(bookingId);

	if (!booking) {
		throw new AppError(HttpStatus.NOT_FOUND, 'Booking not found');
	}

	if (req.user?.role === 'staff') {
		if (booking.hotelId?.toString() !== req.user.hotelId?.toString()) {
			throw new AppError(HttpStatus.FORBIDDEN, 'Unauthorized');
		}
	}

	if (req.user?.role === 'user') {
		if (booking.userId?.toString() !== req.user._id?.toString()) {
			throw new AppError(HttpStatus.FORBIDDEN, 'Unauthorized');
		}
	}

	const payment = await Payment.findOne({ bookingId });

	if (payment && payment.status === 'confirmed') {
		const normalizedAmount = normalizeStoredPaymentAmount(
			payment.amount,
			Number(booking.totalAmount || 0),
		);

		if (Math.abs(Number(payment.amount || 0) - normalizedAmount) > 0.01) {
			payment.amount = normalizedAmount;
			await payment.save();
		}
	}

	res.status(HttpStatus.OK).json({
		success: true,
		data: payment,
	});
});

// @desc    Create SePay checkout URL
// @route   POST /api/v1/payments/sepay/create
const createSepayPayment = catchAsync(async (req, res) => {
	const { bookingId, amount } = req.body;

	const booking = await Booking.findById(bookingId);
	if (!booking) {
		throw new AppError(HttpStatus.NOT_FOUND, 'Booking not found');
	}

	assertBookingCanPay(booking);

	const sepayConfig = getSepayConfig();
	ensureSepayCheckoutConfig(sepayConfig);

	const payableAmountUsd = Number(booking.totalAmount ?? amount ?? 0);
	if (!Number.isFinite(payableAmountUsd) || payableAmountUsd <= 0) {
		throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid booking amount for payment');
	}

	const paymentCode = buildSepayPaymentCode(booking._id, sepayConfig.paymentPrefix);
	await upsertPendingPayment({
		booking,
		paymentCode,
		amountUsd: Number(payableAmountUsd.toFixed(2)),
	});

	const checkoutData = buildCheckoutData({ booking, paymentCode, sepayConfig });
	const paymentUrl = `${sepayConfig.clientUrl}/payment/return?gateway=sepay&bookingId=${booking._id}`;

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'SePay checkout generated successfully',
		paymentUrl,
		data: checkoutData,
	});
});

// @desc    Get SePay checkout details by booking
// @route   GET /api/v1/payments/sepay/checkout/:bookingId
const getSepayCheckoutByBookingId = catchAsync(async (req, res) => {
	const { bookingId } = req.params;

	const booking = await Booking.findById(bookingId);
	if (!booking) {
		throw new AppError(HttpStatus.NOT_FOUND, 'Booking not found');
	}

	const sepayConfig = getSepayConfig();
	ensureSepayCheckoutConfig(sepayConfig);

	const existingPayment = await Payment.findOne({ bookingId: booking._id });
	const paymentCode =
		existingPayment?.paymentCode || buildSepayPaymentCode(booking._id, sepayConfig.paymentPrefix);

	if (booking.status === 'pending') {
		await upsertPendingPayment({
			booking,
			paymentCode,
			amountUsd: Number(Number(booking.totalAmount || 0).toFixed(2)),
		});
	}

	const checkoutData = buildCheckoutData({ booking, paymentCode, sepayConfig });

	res.status(HttpStatus.OK).json({
		success: true,
		data: checkoutData,
	});
});

// @desc    Get SePay payment status by booking
// @route   GET /api/v1/payments/sepay/status/:bookingId
const getSepayPaymentStatusByBookingId = catchAsync(async (req, res) => {
	const { bookingId } = req.params;
	const booking = await Booking.findById(bookingId);

	if (!booking) {
		throw new AppError(HttpStatus.NOT_FOUND, 'Booking not found');
	}

	const payment = await Payment.findOne({ bookingId: booking._id });
	const normalizedAmount = payment
		? normalizeStoredPaymentAmount(payment.amount, Number(booking.totalAmount || 0))
		: Number(Number(booking.totalAmount || 0).toFixed(2));

	if (
		payment &&
		payment.status === 'confirmed' &&
		Math.abs(Number(payment.amount || 0) - normalizedAmount) > 0.01
	) {
		payment.amount = normalizedAmount;
		await payment.save();
	}

	res.status(HttpStatus.OK).json({
		success: true,
		data: {
			bookingId: booking._id,
			bookingStatus: booking.status,
			status: mapPaymentState({ booking, payment }),
			amount: normalizedAmount,
			paymentMethod: payment?.paymentMethod || 'sepay',
			paymentCode: payment?.paymentCode || null,
			paidAt: payment?.paymentDate || null,
		},
	});
});

// @desc    Receive SePay webhook
// @route   POST /api/v1/payments/sepay/webhook
const sepayWebhook = catchAsync(async (req, res) => {
	const sepayConfig = getSepayConfig();
	const authorizationHeader = String(req.headers.authorization || '').trim();

	if (sepayConfig.webhookApiKey) {
		const normalizedHeader = authorizationHeader.toLowerCase();
		const expectedHeader = `apikey ${sepayConfig.webhookApiKey}`.toLowerCase();
		if (normalizedHeader !== expectedHeader) {
			throw new AppError(HttpStatus.UNAUTHORIZED, 'Invalid SePay webhook authorization');
		}
	}

	const payload = req.body;
	if (!payload || typeof payload !== 'object') {
		return res.status(HttpStatus.OK).json({ success: true, message: 'Ignored: empty payload' });
	}

	if (String(payload.transferType || '').toLowerCase() !== 'in') {
		return res.status(HttpStatus.OK).json({ success: true, message: 'Ignored: outgoing transaction' });
	}

	const bookingId = parseBookingIdFromSepayPayload(payload);
	if (!bookingId) {
		return res.status(HttpStatus.OK).json({ success: true, message: 'Ignored: booking id not found in payload' });
	}

	const booking = await Booking.findById(bookingId);
	if (!booking) {
		return res.status(HttpStatus.OK).json({ success: true, message: 'Ignored: booking not found' });
	}

	if (booking.status === 'cancelled' || booking.status === 'expired') {
		return res.status(HttpStatus.OK).json({ success: true, message: 'Ignored: booking not payable' });
	}

	if (
		sepayConfig.accountNumber &&
		payload.accountNumber &&
		String(payload.accountNumber).trim() !== sepayConfig.accountNumber
	) {
		return res.status(HttpStatus.OK).json({
			success: true,
			message: 'Ignored: account number mismatch',
		});
	}

	const transferAmountVnd = toFiniteNumber(payload.transferAmount, 0);
	if (transferAmountVnd <= 0) {
		return res.status(HttpStatus.OK).json({ success: true, message: 'Ignored: invalid amount' });
	}

	const expectedAmountVnd = Math.round(Number(booking.totalAmount || 0) * USD_TO_VND_RATE);
	if (
		expectedAmountVnd > 0 &&
		Math.abs(transferAmountVnd - expectedAmountVnd) > sepayConfig.amountToleranceVnd
	) {
		return res.status(HttpStatus.OK).json({
			success: true,
			message: 'Ignored: amount mismatch',
		});
	}

	const transactionId = payload.id ? String(payload.id) : null;
	if (transactionId) {
		const transactionExists = await Payment.findOne({ externalTransactionId: transactionId });
		if (
			transactionExists &&
			transactionExists.bookingId?.toString() !== booking._id.toString()
		) {
			return res.status(HttpStatus.OK).json({
				success: true,
				message: 'Ignored: transaction already attached to another booking',
			});
		}
	}

	const amountUsd = normalizeUsdAmountFromVnd(
		transferAmountVnd,
		Number(booking.totalAmount || 0),
	);
	const paymentDate = parseSepayTransactionDate(payload.transactionDate);
	const wasPaid = ['paid', 'confirmed'].includes(booking.status);

	if (!wasPaid) {
		booking.status = 'paid';
		await booking.save();
	}

	const existingPayment = await Payment.findOne({ bookingId: booking._id });
	if (!existingPayment) {
		await Payment.create({
			bookingId: booking._id,
			amount: amountUsd,
			status: 'confirmed',
			paymentDate,
			paymentMethod: 'sepay',
			paymentCode:
				String(payload.code || '').trim() ||
				buildSepayPaymentCode(booking._id, sepayConfig.paymentPrefix),
			externalTransactionId: transactionId,
			gatewayName: payload.gateway ? String(payload.gateway) : 'SePay',
			gatewayTransactionDate: paymentDate,
			gatewayPayload: payload,
		});
	} else {
		existingPayment.amount = amountUsd;
		existingPayment.status = 'confirmed';
		existingPayment.paymentDate = paymentDate;
		existingPayment.paymentMethod = 'sepay';
		existingPayment.paymentCode =
			String(payload.code || '').trim() ||
			existingPayment.paymentCode ||
			buildSepayPaymentCode(booking._id, sepayConfig.paymentPrefix);
		existingPayment.externalTransactionId = transactionId || existingPayment.externalTransactionId;
		existingPayment.gatewayName = payload.gateway ? String(payload.gateway) : 'SePay';
		existingPayment.gatewayTransactionDate = paymentDate;
		existingPayment.gatewayPayload = payload;
		await existingPayment.save();
	}

	if (!wasPaid) {
		try {
			await sendEmail({
				email: booking.email,
				subject: 'Booking Confirmation - Roomerang',
				html: `
					<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
						<h2 style="color: #003580;">Payment Successful!</h2>
						<p>Dear ${booking.name || 'Guest'},</p>
						<p>Your transfer via SePay has been confirmed and your booking is now secured.</p>
						<div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
							<p><strong>Booking ID:</strong> ${booking._id}</p>
							<p><strong>Amount:</strong> $${amountUsd.toFixed(2)}</p>
						</div>
						<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
						<p style="font-size: 12px; color: #777;">&copy; ${new Date().getFullYear()} Roomerang. All rights reserved.</p>
					</div>
				`,
			});
		} catch (error) {
			console.error('SePay payment email error:', error.message);
		}
	}

	res.status(HttpStatus.OK).json({ success: true, message: 'Webhook processed' });
});

export {
	getPayments,
	getPaymentByBookingId,
	createSepayPayment,
	getSepayCheckoutByBookingId,
	getSepayPaymentStatusByBookingId,
	sepayWebhook,
};
