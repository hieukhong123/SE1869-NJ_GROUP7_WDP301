import { catchAsync } from '../middlewares/errorMiddleware.js';
import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import RoomCategory from '../models/RoomCategory.js';
import { HttpStatus } from '../utils/httpStatus.js';
import mongoose from 'mongoose';

const normalizeRevenuePaymentAmount = (payment) => {
    const rawAmount = Number(payment?.amount || 0);
    const expectedBookingAmount = Number(payment?.bookingId?.totalAmount || 0);

    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
        return 0;
    }

    if (expectedBookingAmount > 0) {
        const ratio = rawAmount / expectedBookingAmount;
        if (ratio > 99 && ratio < 101) {
            return rawAmount / 100;
        }
    }

    return rawAmount;
};

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
    const firstDayOfNextMonth = new Date(analysisYear, analysisMonthIndex + 1, 1);

    // 1. Total Hotels (System stat, filtered by status if provided)
    const totalHotels = await Hotel.countDocuments(hotelFilter);

    // 2. Total Bookings in selected month
    const totalBookingsFilter = {
        ...bookingFilter,
        bookAt: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
    };
    const totalBookings = await Booking.countDocuments(totalBookingsFilter);

    // 3. New Registered Users/Guests in selected month
    let totalUsers = 0;
    if (req.user && req.user.role === 'staff') {
        const uniqueGuests = await Booking.distinct('userId', totalBookingsFilter);
        totalUsers = uniqueGuests.length;
    } else {
        totalUsers = await User.countDocuments({
            createdAt: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
        });
    }

    // Revenue approach: count ALL confirmed payments, filtered to non-cancelled/expired bookings.
    // This correctly includes:
    //   - Online bookings that went through SePay (pending → paid → confirmed → checked_in/out)
    //   - Manual bookings by staff (confirmed status + confirmed payment created immediately)
    const revenueBookingFilter = {
        ...bookingFilter,
        status: { $nin: ['cancelled', 'expired', 'pending'] },
    };

    const revenueCandidateBookings = await Booking.find(revenueBookingFilter).select(
        '_id status checkIn'
    );
    const revenueEligibleBookingIds = revenueCandidateBookings.map((b) => b._id);

    let confirmedPayments = [];
    if (revenueEligibleBookingIds.length > 0) {
        confirmedPayments = await Payment.find({
            status: 'confirmed',
            bookingId: { $in: revenueEligibleBookingIds },
        })
            .select('amount paymentDate bookingId')
            .populate('bookingId', 'totalAmount');
    }

    const totalRevenue = confirmedPayments
        .filter(p => {
            const pDate = new Date(p.paymentDate);
            return pDate >= firstDayOfMonth && pDate < firstDayOfNextMonth;
        })
        .reduce(
            (acc, payment) => acc + normalizeRevenuePaymentAmount(payment),
            0
        );

    const bookingsByStatusFilter = {
        ...bookingFilter,
        bookAt: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth },
    };

    const bookingsByStatus = await Booking.aggregate([
        { $match: bookingsByStatusFilter },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    const monthlyRevenueMap = new Map();
    confirmedPayments.forEach((payment) => {
        const normalizedAmount = normalizeRevenuePaymentAmount(payment);
        const paymentDate = new Date(payment.paymentDate);
        const year = paymentDate.getFullYear();
        const month = paymentDate.getMonth() + 1;
        const key = `${year}-${month}`;
        const currentRevenue = monthlyRevenueMap.get(key) || 0;
        monthlyRevenueMap.set(key, currentRevenue + normalizedAmount);
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

    const daysInMonth = new Date(analysisYear, analysisMonthIndex + 1, 0).getDate();
    const firstDayWeekday = firstDayOfMonth.getDay();
    const totalWeeks = Math.ceil((daysInMonth + firstDayWeekday) / 7);

    // Initialize daily buckets
    const dailyBuckets = Array.from({ length: daysInMonth }, (_, index) => ({
        day: index + 1,
        revenue: 0,
    }));

    // Initialize weekly buckets
    const weeklyBuckets = Array.from({ length: totalWeeks }, (_, index) => ({
        week: index + 1,
        revenue: 0,
    }));

    confirmedPayments.forEach((payment) => {
        const normalizedAmount = normalizeRevenuePaymentAmount(payment);
        const paymentDate = new Date(payment.paymentDate);
        
        if (
            paymentDate.getFullYear() !== analysisYear ||
            paymentDate.getMonth() !== analysisMonthIndex
        ) {
            return;
        }

        // Daily
        const dayOfMonth = paymentDate.getDate();
        if (dailyBuckets[dayOfMonth - 1]) {
            dailyBuckets[dayOfMonth - 1].revenue += normalizedAmount;
        }

        // Weekly
        const weekOfMonth = Math.ceil((dayOfMonth + firstDayWeekday) / 7);
        if (weeklyBuckets[weekOfMonth - 1]) {
            weeklyBuckets[weekOfMonth - 1].revenue += normalizedAmount;
        }
    });

    const dailyRevenue = dailyBuckets.map(bucket => ({
        day: bucket.day,
        label: `Day ${bucket.day}`,
        revenue: Number(bucket.revenue.toFixed(2)),
    }));

    // --- Occupancy Stats for TODAY ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Total rooms across filtered hotels
    const roomCategories = await RoomCategory.find({
        hotelId: { $in: hotelIds },
        isDeleted: false,
        status: 'available'
    }).select('quantity');

    const totalRooms = roomCategories.reduce((acc, cat) => acc + (cat.quantity || 0), 0);

    // 2. Occupied rooms today
    // A room is occupied if a booking start date <= today AND end date > today
    // And status is active (not cancelled/expired/no_show/checked_out)
    const activeBookingsToday = await Booking.find({
        hotelId: { $in: hotelIds },
        status: { $in: ['confirmed', 'paid', 'checked_in'] },
        checkIn: { $lt: tomorrow },
        checkOut: { $gt: today }
    }).select('roomIds');

    let occupiedRooms = 0;
    activeBookingsToday.forEach(b => {
        occupiedRooms += b.roomIds ? b.roomIds.length : 0;
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
            revenue: Number(bucket.revenue.toFixed(2)),
        };
    });

    // --- Booking Distribution Calculation ---
    // Use the same booking set but refine the distribution logic
    
    // 1. Daily Distribution (Strictly for the selected analysis month)
    const dailyStatusBuckets = Array.from({ length: daysInMonth }, (_, index) => ({
        day: index + 1,
        statuses: {}
    }));

    // 2. Weekly Distribution (Strictly for the selected analysis month)
    const weeklyStatusBuckets = Array.from({ length: totalWeeks }, (_, index) => ({
        week: index + 1,
        statuses: {}
    }));

    // 3. Monthly Distribution (Historical Trend)
    const monthlyStatusMap = new Map();

    // Fetch all relevant bookings once for distribution
    // Note: We use allBookings for monthly trend, but for daily/weekly we only process those in study month
    const allBookings = await Booking.find(bookingFilter).select('status bookAt');
    
    allBookings.forEach(booking => {
        if (!booking.bookAt) return;
        
        const date = new Date(booking.bookAt);
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        const monthKey = `${year}-${month}`;
        
        // --- Monthly Trend Calculation (Universal) ---
        if (!monthlyStatusMap.has(monthKey)) monthlyStatusMap.set(monthKey, {});
        const mRow = monthlyStatusMap.get(monthKey);
        mRow[booking.status] = (mRow[booking.status] || 0) + 1;

        // --- Daily/Weekly Details (Filtered to the selected analysis month) ---
        // Crucial: Use UTC check to match the totalBookingsFilter logic
        const isSameMonth = (year === analysisYear && (month - 1) === analysisMonthIndex);
        
        if (isSameMonth) {
            const day = date.getUTCDate();
            // Week calculation needs to be consistent with revenue
            const week = Math.ceil((day + firstDayWeekday) / 7);
            
            // Daily
            if (dailyStatusBuckets[day - 1]) {
                const dRow = dailyStatusBuckets[day - 1].statuses;
                dRow[booking.status] = (dRow[booking.status] || 0) + 1;
            }

            // Weekly
            if (weeklyStatusBuckets[week - 1]) {
                const wRow = weeklyStatusBuckets[week - 1].statuses;
                wRow[booking.status] = (wRow[booking.status] || 0) + 1;
            }
        }
    });

    const dailyBookingsStatus = dailyStatusBuckets.map(b => ({
        label: `Day ${b.day}`,
        ...b.statuses
    }));

    const weeklyBookingsStatus = weeklyStatusBuckets.map(b => ({
        label: `Week ${b.week}`,
        ...b.statuses
    }));

    // Sort and fill the monthly status distribution
    const monthlyBookingsStatus = Array.from(monthlyStatusMap.entries())
        .map(([key, statuses]) => {
            const [year, month] = key.split('-').map(Number);
            return {
                _id: { year, month },
                label: `${month}/${year}`,
                ...statuses
            };
        })
        .sort((a, b) => {
            if (a._id.year !== b._id.year) return a._id.year - b._id.year;
            return a._id.month - b._id.month;
        });

    res.status(HttpStatus.OK).json({
        success: true,
        data: {
            totalUsers,
            totalHotels,
            totalBookings,
            totalRevenue,
            bookingsByStatus,
            dailyRevenue,
            weeklyRevenue,
            monthlyRevenue,
            dailyBookingsStatus,
            weeklyBookingsStatus,
            monthlyBookingsStatus,
            occupancyStats: {
                totalRooms,
                occupiedRooms,
                availableRooms: Math.max(0, totalRooms - occupiedRooms),
                occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            },
            analysisMonth: `${analysisYear}-${String(analysisMonthIndex + 1).padStart(2, '0')}`,
        },
    });
});

export { getDashboardStats };