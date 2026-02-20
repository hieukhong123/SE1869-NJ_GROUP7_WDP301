import asyncHandler from 'express-async-handler';
import Payment from '../models/Payment.js';

// @desc    Get all payments
// @route   GET /api/v1/payments
// @access  Private/Admin
const getPayments = asyncHandler(async (req, res) => {
	const payments = await Payment.find().populate({
		path: 'bookingId',
		populate: [
			{ path: 'userId', select: 'fullName' },
			{ path: 'hotelId', select: 'name' },
		],
	});
	res.json(payments);
});

export { getPayments };
