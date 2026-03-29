import { catchAsync } from '../middlewares/errorMiddleware.js';
import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { HttpStatus } from '../utils/httpStatus.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private/Admin
const getDashboardStats = catchAsync(async (req, res) => {
	const { hotelStatus } = req.query; // 'active', 'inactive', 'suspended', or 'all'

	const hotelFilter =
		hotelStatus && hotelStatus !== 'all' ? { status: hotelStatus } : {};

	const totalUsers = await User.countDocuments();
	const totalHotels = await Hotel.countDocuments(hotelFilter);

	// For bookings and revenue, we need to filter by hotel status if provided
	let bookingFilter = {};
	let paymentFilter = { status: 'confirmed' };

	if (hotelStatus && hotelStatus !== 'all') {
		const targetHotels = await Hotel.find({ status: hotelStatus }).select(
			'_id',
		);
		const targetHotelIds = targetHotels.map((h) => h._id);
		bookingFilter.hotelId = { $in: targetHotelIds };

		// To filter payments by hotel status, we need to join with bookings
		const targetBookings = await Booking.find({
			hotelId: { $in: targetHotelIds },
		}).select('_id');
		const targetBookingIds = targetBookings.map((b) => b._id);
		paymentFilter.bookingId = { $in: targetBookingIds };
	}

	const totalBookings = await Booking.countDocuments(bookingFilter);

	const confirmedPayments = await Payment.find(paymentFilter);
	const totalRevenue = confirmedPayments.reduce(
		(acc, payment) => acc + payment.amount,
		0,
	);

	const bookingsByStatus = await Booking.aggregate([
		{ $match: bookingFilter },
		{
			$group: {
				_id: '$status',
				count: { $sum: 1 },
			},
		},
	]);

	const monthlyRevenue = await Payment.aggregate([
		{
			$match: paymentFilter,
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

	res.status(HttpStatus.OK).json({
		success: true,
		data: {
			totalUsers,
			totalHotels,
			totalBookings,
			totalRevenue,
			bookingsByStatus,
			monthlyRevenue,
		},
	});
});

export { getDashboardStats };
