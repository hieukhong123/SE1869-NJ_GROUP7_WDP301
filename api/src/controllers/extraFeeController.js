import { catchAsync } from '../middlewares/errorMiddleware.js';
import ExtraFee from '../models/ExtraFee.js';
import Booking from '../models/Booking.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';

// @desc    Get all extra fees
// @route   GET /api/v1/extra-fees
// @access  Private/Admin
const getExtraFees = catchAsync(async (req, res) => {
	const { hotelId, minPrice, maxPrice } = req.query;
	const filter = { isDeleted: false };

	if (hotelId && hotelId !== 'all') {
		filter.hotelId = hotelId;
	}

	if (minPrice !== undefined || maxPrice !== undefined) {
		filter.extraPrice = {};
		if (minPrice !== undefined && minPrice !== '') {
			filter.extraPrice.$gte = Number(minPrice);
		}
		if (maxPrice !== undefined && maxPrice !== '') {
			filter.extraPrice.$lte = Number(maxPrice);
		}
	}

	const extraFees = await ExtraFee.find(filter).populate('hotelId', 'name');
	res.status(HttpStatus.OK).json({
		success: true,
		data: extraFees,
	});
});

// @desc    Get extra fee by ID
// @route   GET /api/v1/extra-fees/:id
// @access  Private/Admin
const getExtraFeeById = catchAsync(async (req, res, next) => {
	const extraFee = await ExtraFee.findOne({
		_id: req.params.id,
		isDeleted: false,
	});

	if (extraFee) {
		res.status(HttpStatus.OK).json({
			success: true,
			data: extraFee,
		});
	} else {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Extra fee not found'));
	}
});

// @desc    Create an extra fee
// @route   POST /api/v1/extra-fees
// @access  Private/Admin
const createExtraFee = catchAsync(async (req, res, next) => {
	const { hotelId, extraName, extraPrice } = req.body;
	const parsedPrice = Number(extraPrice);

	if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Extra price is invalid'));
	}

	const extraFee = new ExtraFee({
		hotelId,
		extraName,
		extraPrice: parsedPrice,
	});

	const createdExtraFee = await extraFee.save();
	res.status(HttpStatus.CREATED).json({
		success: true,
		data: createdExtraFee,
	});
});

// @desc    Update an extra fee
// @route   PUT /api/v1/extra-fees/:id
// @access  Private/Admin
const updateExtraFee = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { hotelId, extraName, extraPrice } = req.body;

	const extraFee = await ExtraFee.findOne({ _id: id, isDeleted: false });

	if (!extraFee) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Extra fee not found'));
	}

	// Check for active bookings
	const activeBookings = await Booking.exists({
		extraIds: id,
		status: { $in: ['paid', 'confirmed', 'checked_in'] },
	});

	if (activeBookings) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Cannot update an extra fee that is part of active bookings (paid, confirmed, or checked-in).',
			),
		);
	}

	extraFee.hotelId = hotelId || extraFee.hotelId;
	extraFee.extraName = extraName || extraFee.extraName;
	if (extraPrice !== undefined) {
		const parsedPrice = Number(extraPrice);
		if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
			return next(
				new AppError(HttpStatus.BAD_REQUEST, 'Extra price is invalid'),
			);
		}
		extraFee.extraPrice = parsedPrice;
	}

	const updatedExtraFee = await extraFee.save();
	res.status(HttpStatus.OK).json({
		success: true,
		data: updatedExtraFee,
	});
});

// @desc    Delete an extra fee
// @route   DELETE /api/v1/extra-fees/:id
// @access  Private/Admin
const deleteExtraFee = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const extraFee = await ExtraFee.findOne({ _id: id, isDeleted: false });

	if (!extraFee) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Extra fee not found'));
	}

	// Check for active bookings
	const activeBookings = await Booking.exists({
		extraIds: id,
		status: { $in: ['paid', 'confirmed', 'checked_in'] },
	});

	if (activeBookings) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Cannot delete an extra fee that is part of active bookings (paid, confirmed, or checked-in).',
			),
		);
	}

	extraFee.isDeleted = true;
	extraFee.deletedAt = new Date();
	await extraFee.save();
	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Extra fee archived',
	});
});

export {
	getExtraFees,
	getExtraFeeById,
	createExtraFee,
	updateExtraFee,
	deleteExtraFee,
};

