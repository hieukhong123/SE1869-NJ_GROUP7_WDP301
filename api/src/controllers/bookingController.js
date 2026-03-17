import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import RoomCategory from '../models/RoomCategory.js';
import RoomReservation from '../models/RoomReservation.js';
import { HttpStatus } from '../utils/httpStatus.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';
import AppError from '../utils/AppError.js';

// Helper to normalize date to start of day (midnight) in local time
const normalizeDate = (dateStr) => {
	const d = new Date(dateStr);
	d.setHours(0, 0, 0, 0);
	return d;
};

export const createBooking = catchAsync(async (req, res, next) => {
	const { hotelId, roomIds, checkIn, checkOut } = req.body;
	const start = normalizeDate(checkIn);
	const end = normalizeDate(checkOut);

	// Check if hotel is active
	const hotel = await Hotel.findById(hotelId);
	if (!hotel || hotel.status === false) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'This hotel is no longer available for booking'));
	}

	// Validate the temporary reservation if provided
	let activeReservation = null;
	if (req.body.reservationId) {
		activeReservation = await RoomReservation.findById(req.body.reservationId);
		if (!activeReservation || activeReservation.expiresAt < new Date()) {
			return next(new AppError(HttpStatus.BAD_REQUEST, 'Your room hold has expired. Please try again.'));
		}
	}

	// Group requested rooms to check availability for each category
	const requestedRoomCounts = {};
	roomIds.forEach((id) => {
		requestedRoomCounts[id] = (requestedRoomCounts[id] || 0) + 1;
	});

	// Check availability for each unique room category in the requested date range
	for (const [roomId, count] of Object.entries(requestedRoomCounts)) {
		const room = await RoomCategory.findById(roomId);
		if (!room || room.status === 'unavailable') {
			return next(
				new AppError(
					HttpStatus.BAD_REQUEST,
					`Room category is no longer available`,
				),
			);
		}

		// Find existing bookings that overlap with this range
		const overlappingBookings = await Booking.find({
			roomIds: roomId,
			status: { $nin: ['cancelled', 'expired'] },
			checkIn: { $lt: end },
			checkOut: { $gt: start }
		});

		let bookedCount = 0;
		overlappingBookings.forEach((booking) => {
			// Ignore pending bookings that have expired but haven't been updated yet
			if (booking.status === 'pending' && booking.expiresAt && booking.expiresAt < new Date()) {
				return;
			}
			const countInBooking = booking.roomIds.filter(
				(id) => id.toString() === roomId,
			).length;
			bookedCount += countInBooking;
		});

		if (bookedCount + count > room.quantity) {
			return next(
				new AppError(
					HttpStatus.BAD_REQUEST,
					`Not enough rooms available for ${room.roomName} during these dates.`,
				),
			);
		}
	}

	const expiresAt = activeReservation 
		? activeReservation.expiresAt 
		: new Date(Date.now() + 5 * 60 * 1000);

	const newBooking = await Booking.create({
		...req.body,
		checkIn: start,
		checkOut: end,
		expiresAt
	});

	// Release the temporary hold now that booking is confirmed
	if (activeReservation) {
		await RoomReservation.findByIdAndDelete(activeReservation._id);
	}

	const booking = await Booking.findById(newBooking._id)
		.populate('hotelId', 'name')
		.populate('roomIds', 'roomName roomPrice')
		.populate('extraIds', 'extraName extraPrice');

	res.status(HttpStatus.CREATED).json({
		success: true,
		message: 'Booking created successfully',
		data: booking,
	});
});

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
			new AppError(
				HttpStatus.NOT_FOUND,
				'Booking not found with that ID',
			),
		);
	}

	if (booking.status === 'pending' && booking.expiresAt && booking.expiresAt < new Date()) {
		booking.status = 'expired';
		await booking.save();
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
		{ new: true, runValidators: true },
	);

	if (!updatedBooking) {
		return next(
			new AppError(
				HttpStatus.NOT_FOUND,
				'Booking not found with that ID',
			),
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
			new AppError(
				HttpStatus.NOT_FOUND,
				'Booking not found with that ID',
			),
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

	let bookings = await Booking.find({ userId })
		.populate('hotelId', 'name location image city photos')
		.populate('roomIds', 'roomName roomPrice')
		.populate('extraIds', 'extraName extraPrice')
		.sort({ createdAt: -1 });

	// Auto-expire pending bookings
	let updated = false;
	const now = new Date();
	bookings = await Promise.all(bookings.map(async (booking) => {
		if (booking.status === 'pending' && booking.expiresAt && booking.expiresAt < now) {
			booking.status = 'expired';
			updated = true;
			return await booking.save();
		}
		return booking;
	}));

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
			new AppError(
				HttpStatus.NOT_FOUND,
				'Booking not found with that ID',
			),
		);
	}

	// Check if booking is already cancelled
	if (booking.status === 'cancelled') {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Booking is already cancelled',
			),
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
