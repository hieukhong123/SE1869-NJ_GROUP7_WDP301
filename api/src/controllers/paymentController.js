import { catchAsync } from '../middlewares/errorMiddleware.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
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

	if (booking.status === 'expired' || booking.status === 'cancelled') {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Booking is no longer valid for payment',
			),
		);
	}

	if (booking.status === 'confirmed') {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Booking is already confirmed',
			),
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
	const booking = bookingId ? await Booking.findById(bookingId) : null;
	const amountUsd = normalizeUsdAmountFromVnp(
		req.query.vnp_Amount,
		Number(booking?.totalAmount || 0),
	);

	if (verify.isSuccess) {
		if (
			booking &&
			booking.status !== 'confirmed' &&
			booking.status !== 'paid'
		) {
			booking.status = 'paid';
			await booking.save();

			// Create payment record if not exists
			const existingPayment = await Payment.findOne({ bookingId });
			if (!existingPayment) {
				await Payment.create({
					bookingId: booking._id,
					amount: amountUsd,
					status: 'confirmed',
					paymentDate: new Date(),
				});
			} else if (
				Math.abs(Number(existingPayment.amount || 0) - amountUsd) > 0.01 ||
				existingPayment.status !== 'confirmed'
			) {
				existingPayment.amount = amountUsd;
				existingPayment.status = 'confirmed';
				existingPayment.paymentDate = new Date();
				await existingPayment.save();
			}

			// Send success email
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
		const bookingId = txnRef.split('-')[0];
		const booking = await Booking.findById(bookingId);
		const amountUsd = normalizeUsdAmountFromVnp(
			req.query.vnp_Amount,
			Number(booking?.totalAmount || 0),
		);

		if (
			booking &&
			booking.status !== 'confirmed' &&
			booking.status !== 'paid'
		) {
			booking.status = 'paid';
			await booking.save();

			const existingPayment = await Payment.findOne({ bookingId });
			if (!existingPayment) {
				await Payment.create({
					bookingId: booking._id,
					amount: amountUsd,
					status: 'confirmed',
					paymentDate: new Date(),
				});
			} else if (
				Math.abs(Number(existingPayment.amount || 0) - amountUsd) > 0.01 ||
				existingPayment.status !== 'confirmed'
			) {
				existingPayment.amount = amountUsd;
				existingPayment.status = 'confirmed';
				existingPayment.paymentDate = new Date();
				await existingPayment.save();
			}
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
