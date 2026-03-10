import { catchAsync } from '../middlewares/errorMiddleware.js';
import Refund from '../models/Refund.js';
import Payment from '../models/Payment.js';
import { HttpStatus } from '../utils/httpStatus.js';
import AppError from '../utils/AppError.js';

// @desc    Get all refunds
// @route   GET /api/v1/refunds
// @access  Private/Admin
const getRefunds = catchAsync(async (req, res) => {
	const refunds = await Refund.find().populate({
		path: 'paymentId',
		populate: {
			path: 'bookingId',
			populate: [
				{ path: 'userId', select: 'fullName' },
				{ path: 'hotelId', select: 'name' },
			],
		},
	});
	res.status(HttpStatus.OK).json({
		success: true,
		data: refunds,
	});
});

// @desc    Get refund by booking ID
// @route   GET /api/v1/refunds/booking/:bookingId
// @access  Public
const getRefundByBookingId = catchAsync(async (req, res, next) => {
    const { bookingId } = req.params;
    
    // Find payment for this booking
    const payment = await Payment.findOne({ bookingId });
    if (!payment) {
        return res.status(HttpStatus.OK).json({ success: true, data: null });
    }

    const refund = await Refund.findOne({ paymentId: payment._id });
    res.status(HttpStatus.OK).json({
        success: true,
        data: refund,
    });
});

// @desc    Create refund request
// @route   POST /api/v1/refunds
// @access  Public
const createRefund = catchAsync(async (req, res, next) => {
    const { paymentId, bankNumber, bankName, reasons } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
        return next(new AppError(HttpStatus.NOT_FOUND, 'Payment not found'));
    }

    const refund = await Refund.create({
        paymentId,
        bankNumber,
        bankName,
        reasons,
        status: 'pending'
    });

    res.status(HttpStatus.CREATED).json({
        success: true,
        data: refund,
    });
});

export { getRefunds, getRefundByBookingId, createRefund };
