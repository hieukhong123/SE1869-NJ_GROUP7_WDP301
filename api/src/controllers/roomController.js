import RoomCategory from '../models/RoomCategory.js';
import Hotel from '../models/Hotel.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';

export const getRooms = catchAsync(async (req, res, next) => {
	const filter = {};
	if (req.query.hotelId) {
		filter.hotelId = req.query.hotelId;
	}

	const rooms = await RoomCategory.find(filter).populate('hotelId', 'name');

	res.status(HttpStatus.OK).json({
		success: true,
		count: rooms.length,
		data: rooms,
	});
});

export const getRoom = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const room = await RoomCategory.findById(id);

	res.status(HttpStatus.OK).json({
		success: true,
		data: room,
	});
});

export const createRoom = catchAsync(async (req, res, next) => {
	const {
		roomName,
		roomPrice,
		maxOccupancy,
		quantity,
		hotelId,
		description,
		photo,
	} = req.body;

	if (roomPrice <= 0) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Room price must be a positive value.'
			)
		);
	}

	if (!Number.isInteger(Number(maxOccupancy)) || maxOccupancy <= 0) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Maximum occupancy must be a positive number.'
			)
		);
	}

	const hotel = await Hotel.findById(hotelId);
	if (!hotel) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Selected hotel not found.')
		);
	}

	const existingRoom = await RoomCategory.findOne({ roomName, hotelId });
	if (existingRoom) {
		return next(
			new AppError(
				HttpStatus.CONFLICT,
				'Room name already exists for this hotel. Please choose a different name.'
			)
		);
	}

	const newRoom = new RoomCategory({
		roomName,
		roomPrice,
		maxOccupancy,
		quantity,
		hotelId,
		description,
		photo,
		status: quantity > 0 ? 'available' : 'unavailable',
	});

	const savedRoom = await newRoom.save();

	res.status(HttpStatus.CREATED).json({
		success: true,
		message: 'Room created successfully',
		data: savedRoom,
	});
});

export const updateRoom = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const updates = req.body;

	const currentRoom = await RoomCategory.findById(id);
	if (!currentRoom) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Room not found'));
	}

	if (updates.roomPrice !== undefined && updates.roomPrice <= 0) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Room price must be a positive value.'
			)
		);
	}

	if (
		updates.maxOccupancy !== undefined &&
		(!Number.isInteger(Number(updates.maxOccupancy)) ||
			updates.maxOccupancy <= 0)
	) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Maximum occupancy must be a positive number.'
			)
		);
	}

	if (updates.roomName && updates.roomName !== currentRoom.roomName) {
		const targetHotelId = updates.hotelId || currentRoom.hotelId;
		const duplicate = await RoomCategory.findOne({
			roomName: updates.roomName,
			hotelId: targetHotelId,
			_id: { $ne: id },
		});

		if (duplicate) {
			return next(
				new AppError(
					HttpStatus.CONFLICT,
					'Room name already exists for this hotel. Please choose a different name.'
				)
			);
		}
	}

	const updatedRoom = await RoomCategory.findByIdAndUpdate(
		id,
		{ $set: updates },
		{ new: true, runValidators: true }
	);

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Room updated successfully',
		data: updatedRoom,
	});
});

export const toggleRoomStatus = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	const room = await RoomCategory.findById(id);
	if (!room) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Room not found'));
	}

	room.status = room.status === 'available' ? 'unavailable' : 'available';
	await room.save();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Room status updated successfully',
		data: room,
	});
});
