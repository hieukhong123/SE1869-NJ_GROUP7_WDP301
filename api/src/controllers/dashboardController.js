import { catchAsync } from '../middlewares/errorMiddleware.js';
import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { HttpStatus } from '../utils/httpStatus.js';
import mongoose from 'mongoose';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private/Admin & Staff
const getDashboardStats = catchAsync(async (req, res) => {
    const { hotelId, hotelStatus } = req.query;

    let hotelFilter = {};

    if (req.user && req.user.role === 'staff') {
        hotelFilter._id = new mongoose.Types.ObjectId(req.user.hotelId);
    } else if (hotelId) {
        hotelFilter._id = new mongoose.Types.ObjectId(hotelId);
    }

    if (hotelStatus && hotelStatus !== 'all') {
        hotelFilter.status = hotelStatus;
    }

    const hotels = await Hotel.find(hotelFilter).select('_id');
    const hotelIds = hotels.map((h) => h._id);

    let bookingFilter = {};
    if (Object.keys(hotelFilter).length > 0 || (req.user && req.user.role === 'staff')) {
        bookingFilter.hotelId = { $in: hotelIds };
    }

    let totalUsers = 0;
    if (req.user && req.user.role === 'staff') {
        const uniqueGuests = await Booking.distinct('userId', bookingFilter);
        totalUsers = uniqueGuests.length;
    } else {
        totalUsers = await User.countDocuments();
    }

    const totalHotels = await Hotel.countDocuments(hotelFilter);
    const totalBookings = await Booking.countDocuments(bookingFilter);

    const bookings = await Booking.find(bookingFilter).select('_id');
    const bookingIds = bookings.map((b) => b._id);

    let paymentFilter = { status: 'confirmed' };

    if (Object.keys(bookingFilter).length > 0 || (req.user && req.user.role === 'staff')) {
        paymentFilter.bookingId = { $in: bookingIds };
    }

    const confirmedPayments = await Payment.find(paymentFilter);

    const totalRevenue = confirmedPayments.reduce(
        (acc, payment) => acc + payment.amount,
        0
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
        { $match: paymentFilter },
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