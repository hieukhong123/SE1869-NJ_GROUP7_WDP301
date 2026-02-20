import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
	const totalUsers = await User.countDocuments();
	const totalHotels = await Hotel.countDocuments();
	const totalBookings = await Booking.countDocuments();

	const confirmedPayments = await Payment.find({ status: 'confirmed' });
	const totalRevenue = confirmedPayments.reduce(
		(acc, payment) => acc + payment.amount,
		0,
	);

	const bookingsByStatus = await Booking.aggregate([
		{
			$group: {
				_id: '$status',
				count: { $sum: 1 },
			},
		},
	]);

	const monthlyRevenue = await Payment.aggregate([
		{
			$match: {
				status: 'confirmed',
			},
		},
		{
			$group: {
				_id: {
					year: { $year: '$paymentDate' },
					month: { $month: '$paymentDate' },
				},
				revenue: { $sum: '$amount' },
			},
		},
		{
			$sort: {
				'_id.year': 1,
				'_id.month': 1,
			},
		},
	]);

	res.json({
		totalUsers,
		totalHotels,
		totalBookings,
		totalRevenue,
		bookingsByStatus,
		monthlyRevenue,
	});
});

export { getDashboardStats };
