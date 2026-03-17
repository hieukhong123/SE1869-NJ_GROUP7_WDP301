import RoomCategory from '../models/RoomCategory.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import RoomReservation from '../models/RoomReservation.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';

// Helper to normalize date to start of day (midnight) in local time
const normalizeDate = (dateStr) => {
	const d = new Date(dateStr);
	d.setHours(0, 0, 0, 0);
	return d;
};

export const getRooms = catchAsync(async (req, res, next) => {
	const { hotelId, checkIn, checkOut } = req.query;
	const filter = {};
	if (hotelId) {
		filter.hotelId = hotelId;
	}

	const rooms = await RoomCategory.find(filter).populate(
		'hotelId',
		'name city photos',
	);

	// If dates are provided, calculate actual availability
	let roomsWithAvailability = rooms.map((room) => ({
		...room.toObject(),
		availableQuantity: room.quantity,
	}));

	if (checkIn && checkOut) {
		const start = normalizeDate(checkIn);
		const end = normalizeDate(checkOut);

		for (let i = 0; i < roomsWithAvailability.length; i++) {
			const room = roomsWithAvailability[i];

			// Find bookings that overlap with requested range for this specific room category
			const overlappingBookings = await Booking.find({
				roomIds: room._id,
				status: { $nin: ['cancelled', 'expired'] },
				checkIn: { $lt: end },
				checkOut: { $gt: start }
			});

			// Count how many of this room type are booked in each overlapping booking
			let bookedCount = 0;
			overlappingBookings.forEach((booking) => {
				// Ignore pending bookings that have expired but haven't been updated yet
				if (booking.status === 'pending' && booking.expiresAt && booking.expiresAt < new Date()) {
					return;
				}
				const countInBooking = booking.roomIds.filter(
					(id) => id.toString() === room._id.toString(),
				).length;
				bookedCount += countInBooking;
			});

			// Also count rooms held by active (unexpired) reservations
			const activeReservations = await RoomReservation.find({
				roomIds: room._id,
				checkIn: { $lt: end },
				checkOut: { $gt: start },
				expiresAt: { $gt: new Date() },
			});
			let reservedCount = 0;
			activeReservations.forEach((rsv) => {
				reservedCount += rsv.roomIds.filter(
					(rid) => rid.toString() === room._id.toString()
				).length;
			});

			roomsWithAvailability[i].availableQuantity = Math.max(
				0,
				room.quantity - bookedCount - reservedCount,
			);
		}
	}

	res.status(HttpStatus.OK).json({
		success: true,
		count: roomsWithAvailability.length,
		data: roomsWithAvailability,
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
				'Room price must be a positive value.',
			),
		);
	}

	if (!Number.isInteger(Number(maxOccupancy)) || maxOccupancy <= 0) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Maximum occupancy must be a positive number.',
			),
		);
	}

	const hotel = await Hotel.findById(hotelId);
	if (!hotel) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Selected hotel not found.'),
		);
	}

	const existingRoom = await RoomCategory.findOne({ roomName, hotelId });
	if (existingRoom) {
		return next(
			new AppError(
				HttpStatus.CONFLICT,
				'Room name already exists for this hotel. Please choose a different name.',
			),
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
				'Room price must be a positive value.',
			),
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
				'Maximum occupancy must be a positive number.',
			),
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
					'Room name already exists for this hotel. Please choose a different name.',
				),
			);
		}
	}

	const updatedRoom = await RoomCategory.findByIdAndUpdate(
		id,
		{ $set: updates },
		{ new: true, runValidators: true },
	);

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Room updated successfully',
		data: updatedRoom,
	});
});

export const deleteRoom = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const room = await RoomCategory.findByIdAndDelete(id);

	if (!room) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Room not found with that ID'),
		);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Room deleted successfully',
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
