import asyncHandler from 'express-async-handler';
import ExtraFee from '../models/ExtraFee.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';

// @desc    Get all extra fees
// @route   GET /api/v1/extra-fees
// @access  Private/Admin
const getExtraFees = asyncHandler(async (req, res) => {
	const extraFees = await ExtraFee.find().populate('hotelId', 'name');
	res.json(extraFees);
});

// @desc    Get extra fee by ID
// @route   GET /api/v1/extra-fees/:id
// @access  Private/Admin
const getExtraFeeById = asyncHandler(async (req, res) => {
	const extraFee = await ExtraFee.findById(req.params.id);

	if (extraFee) {
		res.json(extraFee);
	} else {
		throw new AppError(HttpStatus.NOT_FOUND, 'Extra fee not found');
	}
});

// @desc    Create an extra fee
// @route   POST /api/v1/extra-fees
// @access  Private/Admin
const createExtraFee = asyncHandler(async (req, res) => {
	const { hotelId, extraName, extraPrice } = req.body;

	const extraFee = new ExtraFee({
		hotelId,
		extraName,
		extraPrice,
	});

	const createdExtraFee = await extraFee.save();
	res.status(HttpStatus.CREATED).json(createdExtraFee);
});

// @desc    Update an extra fee
// @route   PUT /api/v1/extra-fees/:id
// @access  Private/Admin
const updateExtraFee = asyncHandler(async (req, res) => {
	const { hotelId, extraName, extraPrice } = req.body;

	const extraFee = await ExtraFee.findById(req.params.id);

	if (extraFee) {
		extraFee.hotelId = hotelId;
		extraFee.extraName = extraName;
		extraFee.extraPrice = extraPrice;

		const updatedExtraFee = await extraFee.save();
		res.json(updatedExtraFee);
	} else {
		throw new AppError(HttpStatus.NOT_FOUND, 'Extra fee not found');
	}
});

// @desc    Delete an extra fee
// @route   DELETE /api/v1/extra-fees/:id
// @access  Private/Admin
const deleteExtraFee = asyncHandler(async (req, res) => {
	const extraFee = await ExtraFee.findById(req.params.id);

	if (extraFee) {
		await ExtraFee.deleteOne({ _id: req.params.id });
		res.json({ message: 'Extra fee removed' });
	} else {
		throw new AppError(HttpStatus.NOT_FOUND, 'Extra fee not found');
	}
});

export {
	getExtraFees,
	getExtraFeeById,
	createExtraFee,
	updateExtraFee,
	deleteExtraFee,
};
