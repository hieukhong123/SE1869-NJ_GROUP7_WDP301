import RoomReservation from '../models/RoomReservation.js';
import Hotel from '../models/Hotel.js';
import { checkRoomAvailability } from '../utils/bookingUtils.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';

export const createReservation = catchAsync(async (req, res, next) => {
	const { hotelId, roomIds, checkIn, checkOut } = req.body;
	const userId = req.user?._id;

	if (!userId) {
		return next(new AppError(HttpStatus.UNAUTHORIZED, 'You are not logged in'));
	}

	if (!roomIds || roomIds.length === 0) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'No rooms specified'));
	}

	if (!hotelId) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Hotel is required'));
	}

	if (
		req.user?.role === 'staff' &&
		req.user.hotelId?.toString() !== hotelId.toString()
	) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
	}

	const start = new Date(checkIn);
	const end = new Date(checkOut);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Invalid check-in/check-out date'));
	}
	start.setHours(0, 0, 0, 0);
	end.setHours(0, 0, 0, 0);

	if (end <= start) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Check-out must be after check-in'));
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	if (start < today) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Check-in date cannot be in the past'));
	}

	const hotel = await Hotel.findById(hotelId).select('status');
	if (!hotel || hotel.status !== 'active') {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'This hotel is no longer available for reservation',
			),
		);
	}

	// Centralized availability check
	const availability = await checkRoomAvailability(
		roomIds,
		start,
		end,
		null,
		hotelId,
	);
	if (!availability.success) {
		return next(new AppError(HttpStatus.BAD_REQUEST, availability.error));
	}

	const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

	const reservation = await RoomReservation.create({
		userId,
		hotelId,
		roomIds,
		checkIn: start,
		checkOut: end,
		expiresAt,
	});

	res.status(HttpStatus.CREATED).json({
		success: true,
		data: reservation,
	});
});

export const deleteReservation = catchAsync(async (req, res, next) => {
	const reservation = await RoomReservation.findById(req.params.id);

	if (!reservation) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Reservation not found'));
	}

	if (
		req.user?.role === 'user' &&
		reservation.userId?.toString() !== req.user._id?.toString()
	) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
	}

	if (
		req.user?.role === 'staff' &&
		reservation.hotelId?.toString() !== req.user.hotelId?.toString()
	) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
	}

	await reservation.deleteOne();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Reservation released',
	});
});
