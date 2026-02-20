import { catchAsync } from '../middlewares/errorMiddleware.js';
import Refund from '../models/Refund.js';
import { HttpStatus } from '../utils/httpStatus.js';

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

export { getRefunds };
