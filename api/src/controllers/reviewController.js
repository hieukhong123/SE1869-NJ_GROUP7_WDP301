import { catchAsync } from '../middlewares/errorMiddleware.js';
import Review from '../models/Review.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';

// @desc    Get all reviews
// @route   GET /api/v1/reviews
// @access  Public
const getReviews = catchAsync(async (req, res) => {
	const reviews = await Review.find()
		.populate('hotelId', 'name')
		.populate('userId', 'fullName');
	res.status(HttpStatus.OK).json({
		success: true,
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
const createReview = catchAsync(async (req, res) => {
	const { hotelId, userId, reviewText, rating } = req.body;

	const review = new Review({
		hotelId,
		userId,
		reviewText,
		rating,
	});

	const createdReview = await review.save();
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
