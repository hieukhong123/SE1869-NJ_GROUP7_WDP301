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
	if (req.query.hotelId && req.query.hotelId !== 'all') {
		filter.hotelId = req.query.hotelId;
	}

	if (req.query.rating) {
		filter.rating = Number(req.query.rating);
	}

	const reviews = await Review.find(filter)
		.populate('hotelId', 'name status')
		.populate('userId', 'fullName email')
		.sort({ createdAt: -1 });

	res.status(HttpStatus.OK).json({
		success: true,
		count: reviews.length,
		data: reviews,
	});
});

// @desc    Get reviews for admin/staff management
// @route   GET /api/v1/reviews/admin
// @access  Private/Admin,Staff
const getAdminReviews = catchAsync(async (req, res) => {
	const filter = {};

	if (req.user?.role === 'staff') {
		filter.hotelId = req.user.hotelId;
	} else if (req.query.hotelId && req.query.hotelId !== 'all') {
		filter.hotelId = req.query.hotelId;
	}

	if (req.query.rating && req.query.rating !== 'all') {
		filter.rating = Number(req.query.rating);
	}

	const reviews = await Review.find(filter)
		.populate('hotelId', 'name status')
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
// @access  Private/Admin,Staff
const getReviewById = catchAsync(async (req, res, next) => {
	const review = await Review.findById(req.params.id)
		.populate('hotelId', 'name')
		.populate('userId', 'fullName');

	if (
		review &&
		req.user?.role === 'staff' &&
		review.hotelId?._id?.toString() !== req.user.hotelId?.toString()
	) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
	}

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
// @access  Private/User
const createReview = catchAsync(async (req, res, next) => {
	const { hotelId, reviewText, rating } = req.body;
	const userId = req.user?._id;

	if (!userId) {
		return next(
			new AppError(HttpStatus.UNAUTHORIZED, 'Please log in to submit a review'),
		);
	}

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
// @access  Private/Admin,Staff
const deleteReview = catchAsync(async (req, res, next) => {
	const review = await Review.findById(req.params.id);

	if (
		review &&
		req.user?.role === 'staff' &&
		review.hotelId?.toString() !== req.user.hotelId?.toString()
	) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
	}

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

export { getReviews, getAdminReviews, getReviewById, createReview, deleteReview };
