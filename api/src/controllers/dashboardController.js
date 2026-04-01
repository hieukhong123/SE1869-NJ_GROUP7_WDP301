import { catchAsync } from '../middlewares/errorMiddleware.js';
import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { HttpStatus } from '../utils/httpStatus.js';
import mongoose from 'mongoose';
import {
    REVENUE_COUNTED_STATUSES,
    isBookingRevenueEligible,
} from '../utils/bookingTiming.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private/Admin & Staff
const getDashboardStats = catchAsync(async (req, res) => {
    const { hotelId, hotelStatus, analysisMonth } = req.query;

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

    const revenueBookingFilter = {
        ...bookingFilter,
        status: { $in: REVENUE_COUNTED_STATUSES },
    };

    const now = new Date();
    const revenueCandidateBookings = await Booking.find(revenueBookingFilter).select(
        '_id status checkIn'
    );

    const revenueEligibleBookingIds = revenueCandidateBookings
        .filter((booking) => isBookingRevenueEligible(booking, now))
        .map((booking) => booking._id);

    let confirmedPayments = [];
    if (revenueEligibleBookingIds.length > 0) {
        confirmedPayments = await Payment.find({
            status: 'confirmed',
            bookingId: { $in: revenueEligibleBookingIds },
        }).select('amount paymentDate');
    }

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

    const monthlyRevenueMap = new Map();
    confirmedPayments.forEach((payment) => {
        const paymentDate = new Date(payment.paymentDate);
        const year = paymentDate.getFullYear();
        const month = paymentDate.getMonth() + 1;
        const key = `${year}-${month}`;
        const currentRevenue = monthlyRevenueMap.get(key) || 0;
        monthlyRevenueMap.set(key, currentRevenue + payment.amount);
    });

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
        .map(([key, revenue]) => {
            const [year, month] = key.split('-').map(Number);
            return {
                _id: { year, month },
                revenue,
            };
        })
        .sort((a, b) => {
            if (a._id.year !== b._id.year) {
                return a._id.year - b._id.year;
            }
            return a._id.month - b._id.month;
        });

    const nowDate = new Date();
    let analysisYear = nowDate.getFullYear();
    let analysisMonthIndex = nowDate.getMonth();

    if (analysisMonth) {
        const monthMatch = String(analysisMonth).match(/^(\d{4})-(\d{2})$/);
        if (monthMatch) {
            const parsedYear = Number(monthMatch[1]);
            const parsedMonthIndex = Number(monthMatch[2]) - 1;

            if (parsedMonthIndex >= 0 && parsedMonthIndex <= 11) {
                analysisYear = parsedYear;
                analysisMonthIndex = parsedMonthIndex;
            }
        }
    }

    const firstDayOfMonth = new Date(analysisYear, analysisMonthIndex, 1);
    const daysInMonth = new Date(analysisYear, analysisMonthIndex + 1, 0).getDate();
    const firstDayWeekday = firstDayOfMonth.getDay();
    const totalWeeks = Math.ceil((daysInMonth + firstDayWeekday) / 7);

    const weeklyBuckets = Array.from({ length: totalWeeks }, (_, index) => ({
        week: index + 1,
        revenue: 0,
    }));

    confirmedPayments.forEach((payment) => {
        const paymentDate = new Date(payment.paymentDate);
        if (
            paymentDate.getFullYear() !== analysisYear ||
            paymentDate.getMonth() !== analysisMonthIndex
        ) {
            return;
        }

        const weekOfMonth = Math.ceil(
            (paymentDate.getDate() + firstDayWeekday) / 7
        );

        const bucket = weeklyBuckets[weekOfMonth - 1];
        if (bucket) {
            bucket.revenue += payment.amount;
        }
    });

    const weeklyRevenue = weeklyBuckets.map((bucket) => {
        const calendarStartDay = (bucket.week - 1) * 7 - firstDayWeekday + 1;
        const calendarEndDay = calendarStartDay + 6;
        const startDay = Math.max(1, calendarStartDay);
        const endDay = Math.min(daysInMonth, calendarEndDay);

        return {
            week: bucket.week,
            startDay,
            endDay,
            label:
                startDay === endDay
                    ? `Week ${bucket.week} (${startDay})`
                    : `Week ${bucket.week} (${startDay}-${endDay})`,
            revenue: bucket.revenue,
        };
    });

    res.status(HttpStatus.OK).json({
        success: true,
        data: {
            totalUsers,
            totalHotels,
            totalBookings,
            totalRevenue,
            bookingsByStatus,
            monthlyRevenue,
            weeklyRevenue,
            analysisMonth: `${analysisYear}-${String(analysisMonthIndex + 1).padStart(2, '0')}`,
        },
    });
});

export { getDashboardStats };