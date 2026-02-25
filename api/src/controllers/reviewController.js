import { catchAsync } from '../middlewares/errorMiddleware.js';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';

// @desc    Get all reviews
// @route   GET /api/v1/reviews?hotelId=xxx
// @access  Public
const getReviews = catchAsync(async (req, res) => {
	const filter = {};
	if (req.query.hotelId) {
		filter.hotelId = req.query.hotelId;
	}
	
	const reviews = await Review.find(filter)
		.populate('hotelId', 'name')
		.populate('userId', 'fullName email')
		.sort({ createdAt: -1 });
		
	res.status(HttpStatus.OK).json({
		success: true,
		count: reviews.length,
		data: reviews,
	});
});

// @desc    Get review by ID
// @route   GET /api/v1/reviews/:id
// @access  Public
const getReviewById = catchAsync(async (req, res, next) => {
	const review = await Review.findById(req.params.id)
		.populate('hotelId', 'name')
		.populate('userId', 'fullName');

	if (review) {
		res.status(HttpStatus.OK).json({
			success: true,
			data: review,
		});
	} else {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Review not found'));
	}
});

// @desc    Create a review
// @route   POST /api/v1/reviews
// @access  Private
const createReview = catchAsync(async (req, res, next) => {
	const { hotelId, userId, reviewText, rating } = req.body;

	// Check if user has a confirmed booking for this hotel
	const booking = await Booking.findOne({
		userId,
		hotelId,
		status: 'confirmed',
	});

	if (!booking) {
		return next(
			new AppError(
				HttpStatus.FORBIDDEN,
				'You can only review hotels that you have booked',
			),
		);
	}

	// Check if user has already reviewed this hotel
	const existingReview = await Review.findOne({ userId, hotelId });
	if (existingReview) {
		return next(
			new AppError(
				HttpStatus.CONFLICT,
				'You have already reviewed this hotel',
			),
		);
	}

	const review = new Review({
		hotelId,
		userId,
		reviewText,
		rating,
	});

	const createdReview = await review.save();
	
	// Populate the created review before sending response
	await createdReview.populate('userId', 'fullName email');
	await createdReview.populate('hotelId', 'name');
	
	res.status(HttpStatus.CREATED).json({
		success: true,
		data: createdReview,
	});
});

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private/Admin
const deleteReview = catchAsync(async (req, res, next) => {
	const review = await Review.findById(req.params.id);

	if (review) {
		await Review.deleteOne({ _id: req.params.id });
		res.status(HttpStatus.OK).json({
			success: true,
			message: 'Review removed',
		});
	} else {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Review not found'));
	}
});

export { getReviews, getReviewById, createReview, deleteReview };
