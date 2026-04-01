import cron from 'node-cron';
import Booking from '../models/Booking.js';
import { isAtLeastHoursAfterCheckInStart } from '../utils/bookingTiming.js';

const CRON_TIMEZONE = process.env.CRON_TIMEZONE || 'Asia/Ho_Chi_Minh';

export const runAutoCheckoutJob = async () => {
	const now = new Date();
	const result = await Booking.updateMany(
		{
			status: 'checked_in',
			checkOut: { $lte: now },
		},
		{
			$set: { status: 'checked_out' },
		},
	);

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

	const updatedCount = result.modifiedCount || 0;
	console.log(`[CRON][Auto No-show] Updated ${updatedCount} bookings.`);
};

export const initBookingStatusCronJobs = () => {
	cron.schedule(
		'0 12 * * *',
		async () => {
			try {
				await runAutoCheckoutJob();
			} catch (error) {
				console.error('[CRON][Auto Check-out] Failed:', error);
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
