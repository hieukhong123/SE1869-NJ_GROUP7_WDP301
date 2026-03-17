import { catchAsync } from '../middlewares/errorMiddleware.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import { HttpStatus } from '../utils/httpStatus.js';
import AppError from '../utils/AppError.js';
import { VNPay } from 'vnpay';
import { dateFormat } from 'vnpay/utils';
import sendEmail from '../utils/sendEmail.js';

// VNPay instance
const vnpay = new VNPay({
    tmnCode: process.env.VNP_TMNCODE || '2QXUI9CQ',
    secureSecret: process.env.VNP_HASHSECRET || 'ABB8866BA2E17B3C4F817D50965F6392',
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
});

// @desc    Get all payments
// @route   GET /api/v1/payments
const getPayments = catchAsync(async (req, res) => {
	const payments = await Payment.find().populate({
		path: 'bookingId',
		populate: [
			{ path: 'userId', select: 'fullName' },
			{ path: 'hotelId', select: 'name' },
		],
	});
	res.status(HttpStatus.OK).json({
		success: true,
		data: payments,
	});
});

// @desc    Get payment by booking ID
// @route   GET /api/v1/payments/booking/:bookingId
const getPaymentByBookingId = catchAsync(async (req, res) => {
	const { bookingId } = req.params;
	const payment = await Payment.findOne({ bookingId });

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
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Booking is no longer valid for payment'));
	}

	if (booking.status === 'confirmed') {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Booking is already confirmed'));
	}

    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.connection?.socket?.remoteAddress ||
        '127.0.0.1';

    if (ipAddr.includes('::ffff:')) {
        ipAddr = ipAddr.split('::ffff:')[1];
    }

    // Convert USD to VND (1 USD = 25,000 VND)
    // VNPay library takes the VND amount directly as the unit
    const vnpAmount = Math.round(amount * 25000);

    const paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: vnpAmount, 
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: bookingId + '-' + Date.now(),
        vnp_OrderInfo: `Payment for booking ${bookingId}`,
        vnp_OrderType: 'other',
        vnp_ReturnUrl: process.env.VNP_RETURNURL || 'http://localhost:3000/payment/return',
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

	if (verify.isSuccess) {
        // Convert VND back to USD for the database record
		const amountVnd = parseInt(req.query.vnp_Amount);
        const amountUsd = amountVnd / 25000;

		const booking = await Booking.findById(bookingId);

		if (booking && booking.status !== 'confirmed') {
			booking.status = 'confirmed';
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
			amount: amountUsd
		});
	} else {
		// Even if failed, pass the amount if it's available in the query
		const amountVnd = parseInt(req.query.vnp_Amount || 0);
        const amountUsd = amountVnd / 25000;
		
		res.status(HttpStatus.OK).json({
			success: false,
			message: 'Payment verification failed',
			bookingId,
			amount: amountUsd
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
		const amountVnd = parseInt(req.query.vnp_Amount);
        const amountUsd = amountVnd / 25000;

		const booking = await Booking.findById(bookingId);

		if (booking && booking.status !== 'confirmed') {
			booking.status = 'confirmed';
			await booking.save();

			const existingPayment = await Payment.findOne({ bookingId });
			if (!existingPayment) {
				await Payment.create({
					bookingId: booking._id,
					amount: amountUsd,
					status: 'confirmed',
					paymentDate: new Date(),
				});
			}
		}
		res.status(HttpStatus.OK).json({ RspCode: '00', Message: 'Success' });
	} else {
		res.status(HttpStatus.OK).json({ RspCode: '97', Message: 'Fail checksum' });
	}
});

export {
	getPayments,
	getPaymentByBookingId,
	createVnpayPayment,
	vnpayReturn,
	vnpayIpn,
};
