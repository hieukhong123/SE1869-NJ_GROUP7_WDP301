import { catchAsync } from '../middlewares/errorMiddleware.js';
import ExtraFee from '../models/ExtraFee.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';

// @desc    Get all extra fees
// @route   GET /api/v1/extra-fees
// @access  Private/Admin
const getExtraFees = catchAsync(async (req, res) => {
	const extraFees = await ExtraFee.find().populate('hotelId', 'name');
	res.status(HttpStatus.OK).json({
		success: true,
		data: extraFees,
	});
});

// @desc    Get extra fee by ID
// @route   GET /api/v1/extra-fees/:id
// @access  Private/Admin
const getExtraFeeById = catchAsync(async (req, res, next) => {
	const extraFee = await ExtraFee.findById(req.params.id);

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
const createExtraFee = catchAsync(async (req, res) => {
	const { hotelId, extraName, extraPrice } = req.body;

	const extraFee = new ExtraFee({
		hotelId,
		extraName,
		extraPrice,
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
	const { hotelId, extraName, extraPrice } = req.body;

	const extraFee = await ExtraFee.findById(req.params.id);

	if (extraFee) {
		extraFee.hotelId = hotelId;
		extraFee.extraName = extraName;
		extraFee.extraPrice = extraPrice;

		const updatedExtraFee = await extraFee.save();
		res.status(HttpStatus.OK).json({
			success: true,
			data: updatedExtraFee,
		});
	} else {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Extra fee not found'));
	}
});

// @desc    Delete an extra fee
// @route   DELETE /api/v1/extra-fees/:id
// @access  Private/Admin
const deleteExtraFee = catchAsync(async (req, res, next) => {
	const extraFee = await ExtraFee.findById(req.params.id);

	if (extraFee) {
		await ExtraFee.deleteOne({ _id: req.params.id });
		res.status(HttpStatus.OK).json({
			success: true,
			message: 'Extra fee removed',
		});
	} else {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Extra fee not found'));
	}
});

export {
	getExtraFees,
	getExtraFeeById,
	createExtraFee,
	updateExtraFee,
	deleteExtraFee,
};

