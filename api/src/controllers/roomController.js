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

const buildRoomFilter = ({ hotelId, status, minPrice, maxPrice }) => {
	const filter = { isDeleted: false };

	if (hotelId && hotelId !== 'all') {
		filter.hotelId = hotelId;
	}

	if (status && status !== 'all') {
		filter.status = status;
	}

	if (minPrice !== undefined || maxPrice !== undefined) {
		filter.roomPrice = {};
		if (minPrice !== undefined && minPrice !== '') {
			filter.roomPrice.$gte = Number(minPrice);
		}
		if (maxPrice !== undefined && maxPrice !== '') {
			filter.roomPrice.$lte = Number(maxPrice);
		}
	}

	return filter;
};

const loadRoomsWithAvailability = async ({ filter, checkIn, checkOut }) => {
	const rooms = await RoomCategory.find(filter).populate(
		'hotelId',
		'name city photos status',
	);

	if (!checkIn || !checkOut) {
		return rooms.map((room) => ({
			...room.toObject(),
			availableQuantity: room.quantity,
		}));
	}

	const start = normalizeDate(checkIn);
	const end = normalizeDate(checkOut);

	const roomsWithAvailability = await Promise.all(
		rooms.map(async (room) => {
			const overlappingBookings = await Booking.find({
				roomIds: room._id,
				status: { $nin: ['cancelled', 'expired', 'no_show', 'checked_out'] },
				checkIn: { $lt: end },
				checkOut: { $gt: start },
			});

			let bookedCount = 0;
			overlappingBookings.forEach((booking) => {
				if (booking.status === 'pending' && booking.expiresAt && booking.expiresAt < new Date()) {
					return;
				}
				const countInBooking = booking.roomIds.filter(
					(id) => id.toString() === room._id.toString(),
				).length;
				bookedCount += countInBooking;
			});

			const activeReservations = await RoomReservation.find({
				roomIds: room._id,
				checkIn: { $lt: end },
				checkOut: { $gt: start },
				expiresAt: { $gt: new Date() },
			});
			
			let reservedCount = 0;
			activeReservations.forEach((rsv) => {
				reservedCount += rsv.roomIds.filter(
					(rid) => rid.toString() === room._id.toString(),
				).length;
			});

			return {
				...room.toObject(),
				availableQuantity: Math.max(0, room.quantity - bookedCount - reservedCount),
			};
		})
	);

	return roomsWithAvailability;
};

export const getRooms = catchAsync(async (req, res, next) => {
	const { hotelId, checkIn, checkOut, status, minPrice, maxPrice } = req.query;
	const filter = buildRoomFilter({ hotelId, status, minPrice, maxPrice });
	const roomsWithAvailability = await loadRoomsWithAvailability({
		filter,
		checkIn,
		checkOut,
	});

	res.status(HttpStatus.OK).json({
		success: true,
		count: roomsWithAvailability.length,
		data: roomsWithAvailability,
	});
});

export const getAdminRooms = catchAsync(async (req, res, next) => {
	const { hotelId, checkIn, checkOut, status, minPrice, maxPrice } = req.query;
	const scopedHotelId =
		req.user?.role === 'staff' ? req.user.hotelId?.toString() : hotelId;

	const filter = buildRoomFilter({
		hotelId: scopedHotelId,
		status,
		minPrice,
		maxPrice,
	});
	const roomsWithAvailability = await loadRoomsWithAvailability({
		filter,
		checkIn,
		checkOut,
	});

	res.status(HttpStatus.OK).json({
		success: true,
		count: roomsWithAvailability.length,
		data: roomsWithAvailability,
	});
});

export const getAdminRoomById = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const room = await RoomCategory.findOne({ _id: id, isDeleted: false });

	if (!room) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Room not found'));
	}

	if (
		req.user?.role === 'staff' &&
		room.hotelId?.toString() !== req.user.hotelId?.toString()
	) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
	}

	res.status(HttpStatus.OK).json({
		success: true,
		data: room,
	});
});

export const getRoom = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const room = await RoomCategory.findOne({ _id: id, isDeleted: false });

	if (!room) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Room not found'));
	}

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

	const targetHotelId =
		req.user?.role === 'staff' ? req.user.hotelId : hotelId;

	if (!targetHotelId) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Hotel is required'));
	}

	if (
		req.user?.role === 'staff' &&
		hotelId &&
		hotelId.toString() !== req.user.hotelId?.toString()
	) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
	}

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

	const hotel = await Hotel.findById(targetHotelId);
	if (!hotel) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Selected hotel not found.'),
		);
	}

	const existingRoom = await RoomCategory.findOne({
		roomName,
		hotelId: targetHotelId,
		isDeleted: false,
	});
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
		hotelId: targetHotelId,
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

	const currentRoom = await RoomCategory.findOne({ _id: id, isDeleted: false });
	if (!currentRoom) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Room not found'));
	}

	if (
		req.user?.role === 'staff' &&
		currentRoom.hotelId?.toString() !== req.user.hotelId?.toString()
	) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
	}

	if (
		req.user?.role === 'staff' &&
		updates.hotelId &&
		updates.hotelId.toString() !== req.user.hotelId?.toString()
	) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
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
			isDeleted: false,
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

	const updatedRoom = await RoomCategory.findOneAndUpdate(
		{ _id: id, isDeleted: false },
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

	const room = await RoomCategory.findOne({ _id: id, isDeleted: false });

	if (!room) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Room not found with that ID'),
		);
	}

	if (
		req.user?.role === 'staff' &&
		room.hotelId?.toString() !== req.user.hotelId?.toString()
	) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
	}

	// Check for active bookings
	const activeBookings = await Booking.exists({
		roomIds: id,
		status: { $in: ['paid', 'confirmed', 'checked_in'] },
	});

	if (activeBookings) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Cannot delete a room category that has active bookings (paid, confirmed, or checked-in).',
			),
		);
	}

	room.isDeleted = true;
	room.deletedAt = new Date();
	room.status = 'unavailable';
	await room.save();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Room archived successfully',
	});
});

export const toggleRoomStatus = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	const room = await RoomCategory.findOne({ _id: id, isDeleted: false });
	if (!room) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Room not found'));
	}

	if (
		req.user?.role === 'staff' &&
		room.hotelId?.toString() !== req.user.hotelId?.toString()
	) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
	}

	// Only check if transitioning to unavailable
	if (room.status === 'available') {
		const activeBookings = await Booking.exists({
			roomIds: id,
			status: { $in: ['paid', 'confirmed', 'checked_in'] },
		});

		if (activeBookings) {
			return next(
				new AppError(
					HttpStatus.BAD_REQUEST,
					'Cannot set room to unavailable while there are active bookings (paid, confirmed, or checked-in).',
				),
			);
		}
	}

	room.status = room.status === 'available' ? 'unavailable' : 'available';
	await room.save();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Room status updated successfully',
		data: room,
	});
});
