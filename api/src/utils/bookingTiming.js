export const REVENUE_COUNTED_STATUSES = ['checked_in', 'checked_out', 'no_show'];

export const getCheckInStartTime = (checkInDate) => {
	const date = new Date(checkInDate);
	date.setHours(14, 0, 0, 0);
	return date;
};

export const getExpectedCheckInTime = (checkInDate) => {
	return new Date(checkInDate);
};

export const isAtLeastHoursAfterCheckInStart = (
	checkInDate,
	hours,
	now = new Date(),
) => {
	const checkInStart = getCheckInStartTime(checkInDate);
	const thresholdTime = new Date(
		checkInStart.getTime() + hours * 60 * 60 * 1000,
	);

	return now >= thresholdTime;
};

export const isAtLeastHoursAfterExpectedCheckIn = (
	checkInDate,
	hours,
	now = new Date(),
) => {
	const expectedCheckIn = getExpectedCheckInTime(checkInDate);
	const thresholdTime = new Date(
		expectedCheckIn.getTime() + hours * 60 * 60 * 1000,
	);

	return now >= thresholdTime;
};

export const isBookingRevenueEligible = (booking, now = new Date()) => {
	if (!REVENUE_COUNTED_STATUSES.includes(booking.status)) {
		return false;
	}

	if (booking.status === 'checked_in' || booking.status === 'checked_out') {
		return true;
	}

	return isAtLeastHoursAfterExpectedCheckIn(booking.checkIn, 24, now);
};
