import Hotel from '../models/Hotel.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';

export const createHotel = catchAsync(async (req, res, next) => {
	const newHotel = await Hotel.create(req.body);
	res.status(HttpStatus.CREATED).json({
		success: true,
		message: 'Hotel created successfully',
		data: newHotel,
	});
});

export const getHotels = catchAsync(async (req, res, next) => {
	const hotels = await Hotel.find();

	res.status(HttpStatus.OK).json({
		success: true,
		count: hotels.length,
		data: hotels,
	});
});

export const getHotel = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const hotel = await Hotel.findById(id);

	if (!hotel) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Hotel not found'));
	}

	res.status(HttpStatus.OK).json({
		success: true,
		data: hotel,
	});
});

export const updateHotel = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	const updatedHotel = await Hotel.findByIdAndUpdate(
		id,
		{ $set: req.body },
		{ new: true, runValidators: true },
	);

	if (!updatedHotel) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Hotel not found with that ID'),
		);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Hotel updated successfully',
		data: updatedHotel,
	});
});

export const deleteHotel = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const hotel = await Hotel.findByIdAndDelete(id);

	if (!hotel) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Hotel not found with that ID'),
		);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Hotel deleted successfully',
	});
});
