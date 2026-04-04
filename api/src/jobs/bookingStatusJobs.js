import cron from 'node-cron';
import Booking from '../models/Booking.js';
import BookingStatusLog from '../models/BookingStatusLog.js';
import { isAtLeastHoursAfterCheckInStart } from '../utils/bookingTiming.js';

const CRON_TIMEZONE = process.env.CRON_TIMEZONE || 'Asia/Ho_Chi_Minh';

export const runAutoCheckoutJob = async () => {
	const now = new Date();
	const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

	const eligibleBookings = await Booking.find({
		status: 'checked_in',
		checkOut: { $lte: twelveHoursAgo },
	}).select('_id');

	if (eligibleBookings.length === 0) {
		console.log('[CRON][Auto Check-out] No eligible booking found.');
		return;
	}

	const bookingIds = eligibleBookings.map(b => b._id);

	const result = await Booking.updateMany(
		{ _id: { $in: bookingIds } },
		{ $set: { status: 'checked_out' } },
	);

	// Create system logs
	const logs = bookingIds.map(id => ({
		bookingId: id,
		oldStatus: 'checked_in',
		newStatus: 'checked_out',
	}));
	await BookingStatusLog.insertMany(logs);

	const updatedCount = result.modifiedCount || 0;
	console.log(`[CRON][Auto Check-out] Updated ${updatedCount} bookings.`);
};

export const runAutoNoShowJob = async () => {
	const now = new Date();
	const confirmedBookings = await Booking.find({ status: 'confirmed' }).select(
		'_id checkIn',
	);

	const noShowBookingIds = confirmedBookings
		.filter((booking) => isAtLeastHoursAfterCheckInStart(booking.checkIn, 22.5, now))
		.map((booking) => booking._id);

	if (noShowBookingIds.length === 0) {
		console.log('[CRON][Auto No-show] No eligible booking found.');
		return;
	}

	const result = await Booking.updateMany(
		{ _id: { $in: noShowBookingIds } },
		{ $set: { status: 'no_show' } },
	);

	// Create system logs
	const logs = noShowBookingIds.map(id => ({
		bookingId: id,
		oldStatus: 'confirmed',
		newStatus: 'no_show',
		// staffId is omitted for system auto log
	}));
	await BookingStatusLog.insertMany(logs);

	const updatedCount = result.modifiedCount || 0;
	console.log(`[CRON][Auto No-show] Updated ${updatedCount} bookings.`);
};

export const runAutoExpireJob = async () => {
	const now = new Date();
	const eligibleBookings = await Booking.find({
		status: 'pending',
		expiresAt: { $lt: now },
	}).select('_id');

	if (eligibleBookings.length === 0) {
		return;
	}

	const bookingIds = eligibleBookings.map(b => b._id);

	await Booking.updateMany(
		{ _id: { $in: bookingIds } },
		{ $set: { status: 'expired' } },
	);

	const logs = bookingIds.map(id => ({
		bookingId: id,
		oldStatus: 'pending',
		newStatus: 'expired',
	}));
	await BookingStatusLog.insertMany(logs);

	console.log(`[CRON][Auto Expire] Updated ${bookingIds.length} bookings.`);
};

export const initBookingStatusCronJobs = () => {
	cron.schedule(
		'0 12 * * *',
		async () => {
			try {
				await runAutoCheckoutJob();
			} catch (error) {
				console.error('[CRON][Auto Jobs] Failed:', error);
			}
		},
		{ timezone: CRON_TIMEZONE },
	);

	// Keep pending booking timeout close to real-time (15-minute hold window)
	cron.schedule(
		'*/1 * * * *',
		async () => {
			try {
				await runAutoExpireJob();
			} catch (error) {
				console.error('[CRON][Auto Expire] Failed:', error);
			}
		},
		{ timezone: CRON_TIMEZONE },
	);

	cron.schedule(
		'30 12 * * *',
		async () => {
			try {
				await runAutoNoShowJob();
			} catch (error) {
				console.error('[CRON][Auto No-show] Failed:', error);
			}
		},
		{ timezone: CRON_TIMEZONE },
	);

	console.log(
		`[CRON] Booking status jobs initialized (timezone: ${CRON_TIMEZONE}).`,
	);
};
