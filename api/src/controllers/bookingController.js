import Booking from '../models/Booking.js';
import { HttpStatus } from '../utils/httpStatus.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';

export const getAllBookings = catchAsync(async (req, res, next) => {
	const bookings = await Booking.find()
		.populate('hotelId', 'name')
		.populate('userId', 'email fullName')
		.populate('roomIds', 'roomName')
		.sort({ createdAt: -1 });

	res.status(HttpStatus.OK).json({
		success: true,
		count: bookings.length,
		data: bookings,
	});
});
