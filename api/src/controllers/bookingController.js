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

// @desc    Get bookings for a specific user
// @route   GET /api/v1/bookings/user/:userId
// @access  Public (user accesses their own bookings)
export const getUserBookings = catchAsync(async (req, res, next) => {
	const { userId } = req.params;

	const bookings = await Booking.find({ userId })
		.populate('hotelId', 'name location image')
		.populate('roomIds', 'name pricePerNight')
		.populate('extraIds', 'name price')
		.sort({ createdAt: -1 });

	res.status(HttpStatus.OK).json({
		success: true,
		count: bookings.length,
		data: bookings,
	});
});

// @desc    Cancel a booking
// @route   PUT /api/v1/bookings/:id/cancel
// @access  Public (user can cancel their own booking)
export const cancelBooking = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	const booking = await Booking.findById(id);

	if (!booking) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Booking not found with that ID')
		);
	}

	// Check if booking is already cancelled
	if (booking.status === 'cancelled') {
		return next(
			new AppError(HttpStatus.BAD_REQUEST, 'Booking is already cancelled')
		);
	}

	// Update status to cancelled
	booking.status = 'cancelled';
	await booking.save();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Booking cancelled successfully',
		data: booking,
	});
});
