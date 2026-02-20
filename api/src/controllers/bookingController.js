import Booking from '../models/Booking.js';
import { HttpStatus } from '../utils/httpStatus.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';
import AppError from '../utils/AppError.js';

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

export const getBookingById = catchAsync(async (req, res, next) => {
	const booking = await Booking.findById(req.params.id)
		.populate('hotelId', 'name')
		.populate('userId', 'email fullName')
		.populate('roomIds', 'roomName')
		.populate('extraIds');

	if (!booking) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Booking not found with that ID')
		);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		data: booking,
	});
});

export const updateBookingStatus = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { status } = req.body;

	const updatedBooking = await Booking.findByIdAndUpdate(
		id,
		{ status },
		{ new: true, runValidators: true }
	);

	if (!updatedBooking) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Booking not found with that ID')
		);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Booking status updated successfully',
		data: updatedBooking,
	});
});

export const deleteBooking = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const booking = await Booking.findByIdAndDelete(id);

	if (!booking) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Booking not found with that ID')
		);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Booking deleted successfully',
	});
});
