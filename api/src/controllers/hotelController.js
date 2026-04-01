import Hotel from '../models/Hotel.js';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import HotelStatusLog from '../models/HotelStatusLog.js';
import mongoose from 'mongoose';
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
	const hotels = await Hotel.find({ status: 'active' });

	res.status(HttpStatus.OK).json({
		success: true,
		count: hotels.length,
		data: hotels,
	});
});

export const getAdminHotels = catchAsync(async (req, res, next) => {
	const query = {};

	if (req.user?.role === 'staff') {
		if (!req.user.hotelId) {
			return res.status(HttpStatus.OK).json({
				success: true,
				count: 0,
				data: [],
			});
		}

		query._id = req.user.hotelId;
	} else if (req.query.hotelId && req.query.hotelId !== 'all') {
		if (!mongoose.Types.ObjectId.isValid(req.query.hotelId)) {
			return next(
				new AppError(HttpStatus.BAD_REQUEST, 'Invalid hotelId'),
			);
		}
		query._id = req.query.hotelId;
	}

	const hotels = await Hotel.find(query);

        res.status(HttpStatus.OK).json({
		success: true,
		count: hotels.length,
		data: hotels,
	});
});

export const getHotel = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const hotel = await Hotel.findOne({ _id: id, status: 'active' });

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
	const oldHotel = await Hotel.findById(id);

	if (!oldHotel) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Hotel not found'));
	}

	if (req.user?.role === 'staff') {
		if (oldHotel._id.toString() !== req.user.hotelId?.toString()) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}
	}

	// Check status change logic
	if (req.body.status && req.body.status !== oldHotel.status) {
		if (req.body.status === 'inactive') {
			// Check if there are paid or confirmed bookings
			const pendingBookings = await Booking.countDocuments({
				hotelId: id,
				status: { $in: ['paid', 'confirmed'] },
			});

			if (pendingBookings > 0) {
				return next(
					new AppError(
						HttpStatus.BAD_REQUEST,
						`Cannot set hotel to inactive. There are ${pendingBookings} paid or confirmed bookings that need to be refunded first.`,
					),
				);
			}
		}

		// Log status change
		await HotelStatusLog.create({
			hotelId: id,
			oldStatus: oldHotel.status,
			newStatus: req.body.status,
			staffId: req.user._id,
		});
	}

	const updatedHotel = await Hotel.findByIdAndUpdate(
		id,
		{ $set: req.body },
		{ new: true, runValidators: true },
	);

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Hotel updated successfully',
		data: updatedHotel,
	});
});

export const deleteHotel = catchAsync(async (req, res, next) => {
	return next(
		new AppError(
			HttpStatus.BAD_REQUEST,
			'Deleting hotels is not allowed. Please set the hotel to inactive instead.',
		),
	);
});

export const getFeaturedHotels = catchAsync(async (req, res, next) => {
	// Get featured hotels
	const hotels = await Hotel.find({ featured: true, status: 'active' });

	// Calculate average rating for each hotel
	const hotelsWithRatings = await Promise.all(
		hotels.map(async (hotel) => {
			const reviews = await Review.find({ hotelId: hotel._id });
			const averageRating =
				reviews.length > 0
					? reviews.reduce((sum, review) => sum + review.rating, 0) /
						reviews.length
					: 0;
			const reviewCount = reviews.length;

			return {
				...hotel.toObject(),
				averageRating:
					averageRating > 0 ? averageRating.toFixed(1) : 'N/A',
				reviewCount,
			};
		}),
	);

	res.status(HttpStatus.OK).json({
		success: true,
		count: hotelsWithRatings.length,
		data: hotelsWithRatings,
	});
});

export const getCitiesWithCount = catchAsync(async (req, res, next) => {
	// Aggregate hotels by city
	const citiesData = await Hotel.aggregate([
		{
			$match: { status: 'active' },
		},
		{
			$group: {
				_id: '$city',
				count: { $sum: 1 },
				image: {
					$first: {
						$ifNull: [
							{ $arrayElemAt: ['$photos', 1] },
							{ $arrayElemAt: ['$photos', 0] },
						],
					},
				},
			},
		},
		{
			$project: {
				_id: 0,
				name: '$_id',
				count: 1,
				image: 1,
			},
		},
		{
			$sort: { count: -1 },
		},
	]);

	res.status(HttpStatus.OK).json({
		success: true,
		count: citiesData.length,
		data: citiesData,
	});
});

export const getPropertyTypes = catchAsync(async (req, res, next) => {
	// Aggregate hotels by property type
	const typesData = await Hotel.aggregate([
		{
			$match: { status: 'active' },
		},
		{
			$group: {
				_id: '$propertyType',
				count: { $sum: 1 },
				// Get the first photo from hotels of this type as representative image
				image: { $first: { $arrayElemAt: ['$photos', 0] } },
			},
		},
		{
			$project: {
				_id: 0,
				name: '$_id',
				count: 1,
				image: 1,
			},
		},
		{
			$sort: { count: -1 },
		},
	]);

	res.status(HttpStatus.OK).json({
		success: true,
		count: typesData.length,
		data: typesData,
	});
});

export const updateHotelStatus = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { status, staffId } = req.body;

	const hotel = await Hotel.findById(id);

	if (!hotel) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Hotel not found'));
	}

	if (status === hotel.status) {
		return res.status(HttpStatus.OK).json({
			success: true,
			data: hotel,
		});
	}

	if (status === 'inactive') {
		const pendingBookings = await Booking.countDocuments({
			hotelId: id,
			status: { $in: ['paid', 'confirmed'] }
		});

		if (pendingBookings > 0) {
			return next(new AppError(HttpStatus.BAD_REQUEST, `Cannot set hotel to inactive. There are ${pendingBookings} paid or confirmed bookings that need to be refunded first.`));
		}
	}

	// Log status change
	await HotelStatusLog.create({
		hotelId: id,
		oldStatus: hotel.status,
		newStatus: status,
		staffId: staffId
	});

	hotel.status = status;
	await hotel.save();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Hotel status updated successfully',
		data: hotel,
	});
});

