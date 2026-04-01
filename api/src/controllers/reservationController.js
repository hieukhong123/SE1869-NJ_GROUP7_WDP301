import RoomReservation from '../models/RoomReservation.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';

export const createReservation = catchAsync(async (req, res, next) => {
	const { userId, hotelId, roomIds, checkIn, checkOut } = req.body;

	if (!roomIds || roomIds.length === 0) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'No rooms specified'));
	}

	const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

	const reservation = await RoomReservation.create({
		userId,
		hotelId,
		roomIds,
		checkIn,
		checkOut,
		expiresAt,
	});

	res.status(HttpStatus.CREATED).json({
		success: true,
		data: reservation,
	});
});

export const deleteReservation = catchAsync(async (req, res) => {
	await RoomReservation.findByIdAndDelete(req.params.id);

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Reservation released',
	});
});
