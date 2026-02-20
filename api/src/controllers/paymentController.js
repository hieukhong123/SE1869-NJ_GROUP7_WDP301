import { catchAsync } from '../middlewares/errorMiddleware.js';
import Payment from '../models/Payment.js';
import { HttpStatus } from '../utils/httpStatus.js';

// @desc    Get all payments
// @route   GET /api/v1/payments
// @access  Private/Admin
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

export { getPayments };
