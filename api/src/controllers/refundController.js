import asyncHandler from 'express-async-handler';
import Refund from '../models/Refund.js';

// @desc    Get all refunds
// @route   GET /api/v1/refunds
// @access  Private/Admin
const getRefunds = asyncHandler(async (req, res) => {
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
	res.json(refunds);
});

export { getRefunds };
