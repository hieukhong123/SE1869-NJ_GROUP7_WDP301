import { catchAsync } from '../middlewares/errorMiddleware.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import BookingStatusLog from '../models/BookingStatusLog.js';
import User from '../models/User.js';
import { HttpStatus } from '../utils/httpStatus.js';
import AppError from '../utils/AppError.js';
import { VNPay } from 'vnpay';
import { dateFormat } from 'vnpay/utils';
import sendEmail from '../utils/sendEmail.js';

const USD_TO_VND_RATE = 25000;
const VNPAY_MINOR_UNIT_FACTOR = 100;

const normalizeUsdAmountFromVnp = (rawVnpAmount, expectedUsd = 0) => {
	const parsedRaw = Number(rawVnpAmount || 0);
	if (!Number.isFinite(parsedRaw) || parsedRaw <= 0) {
		return 0;
	}

	const candidateDirect = parsedRaw / USD_TO_VND_RATE;
	const candidateMinorUnit =
		parsedRaw / (USD_TO_VND_RATE * VNPAY_MINOR_UNIT_FACTOR);

	if (Number.isFinite(expectedUsd) && expectedUsd > 0) {
		const directDiff = Math.abs(candidateDirect - expectedUsd);
		const minorUnitDiff = Math.abs(candidateMinorUnit - expectedUsd);
		const selected = minorUnitDiff < directDiff ? candidateMinorUnit : candidateDirect;
		return Number(selected.toFixed(2));
	}

	return Number(candidateDirect.toFixed(2));
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

const syncConfirmedPayment = async (booking, amountUsd) => {
	const existingPayment = await Payment.findOne({ bookingId: booking._id });

	if (!existingPayment) {
		await Payment.create({
			bookingId: booking._id,
			amount: amountUsd,
			status: 'confirmed',
			paymentDate: new Date(),
		});
		return;
	}

	if (
		Math.abs(Number(existingPayment.amount || 0) - amountUsd) > 0.01 ||
		existingPayment.status !== 'confirmed'
	) {
		existingPayment.amount = amountUsd;
		existingPayment.status = 'confirmed';
		existingPayment.paymentDate = new Date();
		await existingPayment.save();
	}
};

const resolveHotelIdFromBooking = (booking) => {
	if (!booking?.hotelId) {
		return null;
	}

	if (typeof booking.hotelId === 'object' && booking.hotelId?._id) {
		return booking.hotelId._id;
	}

	return booking.hotelId;
};

const notifyHotelStaffWhenBookingPaid = async (booking, amountUsd) => {
	const hotelId = resolveHotelIdFromBooking(booking);
	if (!hotelId) {
		return;
	}

	try {
		const staffMembers = await User.find({
			role: 'staff',
			hotelId,
		}).select('email fullName');

		if (!staffMembers.length) {
			return;
		}

		const hotelName =
			typeof booking.hotelId === 'object' && booking.hotelId?.name
				? booking.hotelId.name
				: 'your property';
		const bookingCode = booking._id?.toString().slice(-8).toUpperCase() || 'N/A';
		const paidAmount = Number(amountUsd || booking.totalAmount || 0).toFixed(2);

		await Promise.all(
			staffMembers
				.filter((staff) => Boolean(staff.email))
				.map((staff) =>
					sendEmail({
						email: staff.email,
						subject: `Payment Received - Booking ${bookingCode}`,
						html: `
							<h3>Hello ${staff.fullName || 'Staff'},</h3>
							<p>A booking payment has just been received for <strong>${hotelName}</strong>.</p>
							<p><strong>Booking reference:</strong> ${bookingCode}</p>
							<p><strong>Amount paid:</strong> $${paidAmount}</p>
							<p>Please review and move the booking from <strong>paid</strong> to <strong>confirmed</strong> after verification.</p>
						`,
					}),
				),
		);
	} catch (error) {
		console.error('[Payment] Failed to notify staff for paid booking:', error);
	}
};

const applyVerifiedPayment = async (booking, amountUsd) => {
	if (!booking) {
		return { ok: false, reason: 'BOOKING_NOT_FOUND' };
	}

	if (booking.status === 'pending' && booking.expiresAt && booking.expiresAt <= new Date()) {
		const oldStatus = booking.status;
		booking.status = 'expired';
		await booking.save();

		await BookingStatusLog.create({
			bookingId: booking._id,
			oldStatus,
			newStatus: 'expired',
		});

		return { ok: false, reason: 'BOOKING_EXPIRED' };
	}

	if (!['pending', 'paid', 'confirmed'].includes(booking.status)) {
		return { ok: false, reason: 'INVALID_BOOKING_STATE' };
	}

	if (booking.status === 'pending') {
		const oldStatus = booking.status;
		booking.status = 'paid';
		await booking.save();

		await BookingStatusLog.create({
			bookingId: booking._id,
			oldStatus,
			newStatus: 'paid',
		});

		await syncConfirmedPayment(booking, amountUsd);
		await notifyHotelStaffWhenBookingPaid(booking, amountUsd);
		return { ok: true, justPaid: true };
	}

	// idempotent success for already processed states
	await syncConfirmedPayment(booking, amountUsd);
	return { ok: true, justPaid: false };
};

// VNPay instance
const vnpay = new VNPay({
	tmnCode: process.env.VNP_TMNCODE || '2QXUI9CQ',
	secureSecret:
		process.env.VNP_HASHSECRET || 'ABB8866BA2E17B3C4F817D50965F6392',
	vnpayHost: 'https://sandbox.vnpayment.vn',
	testMode: true,
});

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

	const payments = await Payment.find(paymentFilter).populate({
		path: 'bookingId',
		select: 'totalAmount userId hotelId',
		populate: [
			{ path: 'userId', select: 'fullName' },
			{ path: 'hotelId', select: 'name status' },
		],
	}).sort({ paymentDate: -1 });

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

// @desc    Create VNPay payment URL
// @route   POST /api/v1/payments/vnpay/create
const createVnpayPayment = catchAsync(async (req, res, next) => {
	const { bookingId, amount } = req.body; // amount is USD

	const booking = await Booking.findById(bookingId).populate('hotelId');
	if (!booking) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Booking not found'));
	}

	if (req.user?.role === 'user') {
		if (booking.userId?.toString() !== req.user._id?.toString()) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}
	}

	if (req.user?.role === 'staff') {
		if (booking.hotelId?._id?.toString() !== req.user.hotelId?.toString()) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}
	}

	if (booking.status === 'pending' && booking.expiresAt && booking.expiresAt <= new Date()) {
		const oldStatus = booking.status;
		booking.status = 'expired';
		await booking.save();

		await BookingStatusLog.create({
			bookingId: booking._id,
			oldStatus,
			newStatus: 'expired',
		});

		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Booking has expired. Please create a new booking',
			),
		);
	}

	if (booking.status === 'expired' || booking.status === 'cancelled') {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Booking is no longer valid for payment',
			),
		);
	}

	if (booking.status === 'confirmed' || booking.status === 'paid') {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Booking has already been paid',
			),
		);
	}

	if (booking.status !== 'pending') {
		return next(
			new AppError(HttpStatus.BAD_REQUEST, 'Booking is not payable in current status'),
		);
	}

	let ipAddr =
		req.headers['x-forwarded-for'] ||
		req.connection?.remoteAddress ||
		req.socket?.remoteAddress ||
		req.connection?.socket?.remoteAddress ||
		'127.0.0.1';

	if (ipAddr.includes('::ffff:')) {
		ipAddr = ipAddr.split('::ffff:')[1];
	}

	const payableAmountUsd = Number(booking.totalAmount ?? amount ?? 0);
	if (!Number.isFinite(payableAmountUsd) || payableAmountUsd <= 0) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Invalid booking amount for payment',
			),
		);
	}

	// Convert USD to VND (1 USD = 25,000 VND)
	// VNPay library takes the VND amount directly as the unit
	const vnpAmount = Math.round(payableAmountUsd * USD_TO_VND_RATE);

	const paymentUrl = vnpay.buildPaymentUrl({
		vnp_Amount: vnpAmount,
		vnp_IpAddr: ipAddr,
		vnp_TxnRef: bookingId + '-' + Date.now(),
		vnp_OrderInfo: `Payment for booking ${bookingId}`,
		vnp_OrderType: 'other',
		vnp_ReturnUrl:
			process.env.VNP_RETURNURL || 'http://localhost:3000/payment/return',
		vnp_Locale: 'vn',
		vnp_CreateDate: dateFormat(new Date()),
	});

	res.status(HttpStatus.OK).json({
		success: true,
		paymentUrl,
	});
});

// @desc    VNPay Return Handle
// @route   GET /api/v1/payments/vnpay/return
const vnpayReturn = catchAsync(async (req, res) => {
	const verify = vnpay.verifyReturnUrl(req.query);
	const txnRef = req.query.vnp_TxnRef;
	const bookingId = txnRef?.split('-')[0];
	const booking = bookingId
		? await Booking.findById(bookingId).populate('hotelId', 'name')
		: null;
	const amountUsd = normalizeUsdAmountFromVnp(
		req.query.vnp_Amount,
		Number(booking?.totalAmount || 0),
	);

	if (verify.isSuccess) {
 		const paymentResult = await applyVerifiedPayment(booking, amountUsd);

		if (!paymentResult.ok) {
			let message = 'Payment cannot be applied to this booking';
			if (paymentResult.reason === 'BOOKING_NOT_FOUND') {
				message = 'Booking not found';
			}
			if (paymentResult.reason === 'BOOKING_EXPIRED') {
				message = 'Booking has expired';
			}
			if (paymentResult.reason === 'INVALID_BOOKING_STATE') {
				message = 'Booking is not payable in current status';
			}

			return res.status(HttpStatus.OK).json({
				success: false,
				message,
				bookingId,
				amount: amountUsd,
			});
		}

		if (paymentResult.justPaid) {
			// Send success email only when transitioning pending -> paid
			try {
				await sendEmail({
					email: booking.email,
					subject: 'Booking Confirmation - Roomerang',
					html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #003580;">Payment Successful!</h2>
                            <p>Dear ${booking.name},</p>
                            <p>Thank you for choosing Roomerang. Your payment has been processed successfully.</p>
                            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Booking ID:</strong> ${booking._id}</p>
                                <p><strong>Amount:</strong> $${amountUsd.toFixed(2)}</p>
                            </div>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #777;">&copy; ${new Date().getFullYear()} Roomerang. All rights reserved.</p>
                        </div>
                    `,
				});
			} catch (err) {
				console.error('Email error:', err.message);
			}
		}

		res.status(HttpStatus.OK).json({
			success: true,
			message: 'Payment verified successfully',
			bookingId,
			amount: amountUsd,
		});
	} else {
		res.status(HttpStatus.OK).json({
			success: false,
			message: 'Payment verification failed',
			bookingId,
			amount: amountUsd,
		});
	}
});

// @desc    VNPay IPN Handle
// @route   GET /api/v1/payments/vnpay/ipn
const vnpayIpn = catchAsync(async (req, res) => {
	const verify = vnpay.verifyIpnCall(req.query);

	if (verify.isSuccess) {
		const txnRef = req.query.vnp_TxnRef;
		const bookingId = txnRef?.split('-')[0];
		if (!bookingId) {
			return res.status(HttpStatus.OK).json({ RspCode: '01', Message: 'Order not found' });
		}

		const populatedBooking = await Booking.findById(bookingId).populate(
			'hotelId',
			'name',
		);
		const amountUsd = normalizeUsdAmountFromVnp(
			req.query.vnp_Amount,
			Number(populatedBooking?.totalAmount || 0),
		);

		const paymentResult = await applyVerifiedPayment(populatedBooking, amountUsd);
		if (!paymentResult.ok) {
			const message =
				paymentResult.reason === 'BOOKING_EXPIRED'
					? 'Booking expired'
					: paymentResult.reason === 'INVALID_BOOKING_STATE'
						? 'Invalid booking state'
						: 'Order not found';

			const rspCode = paymentResult.reason === 'BOOKING_NOT_FOUND' ? '01' : '02';
			return res.status(HttpStatus.OK).json({ RspCode: rspCode, Message: message });
		}

		res.status(HttpStatus.OK).json({ RspCode: '00', Message: 'Success' });
	} else {
		res.status(HttpStatus.OK).json({
			RspCode: '97',
			Message: 'Fail checksum',
		});
	}
});

export {
	getPayments,
	getPaymentByBookingId,
	createVnpayPayment,
	vnpayReturn,
	vnpayIpn,
};
