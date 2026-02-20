import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';

// @desc    Get all reviews
// @route   GET /api/v1/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().populate('hotelId', 'name').populate('userId', 'fullName');
  res.json(reviews);
});

// @desc    Get review by ID
// @route   GET /api/v1/reviews/:id
// @access  Public
const getReviewById = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (review) {
    res.json(review);
  } else {
    throw new AppError(HttpStatus.NOT_FOUND, 'Review not found');
  }
});

// @desc    Create a review
// @route   POST /api/v1/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { hotelId, userId, reviewText, rating } = req.body;

  const review = new Review({
    hotelId,
    userId,
    reviewText,
    rating,
  });

  const createdReview = await review.save();
  res.status(HttpStatus.CREATED).json(createdReview);
});

// @desc    Update a review
// @route   PUT /api/v1/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const { hotelId, userId, reviewText, rating } = req.body;

  const review = await Review.findById(req.params.id);

  if (review) {
    review.hotelId = hotelId;
    review.userId = userId;
    review.reviewText = reviewText;
    review.rating = rating;

    const updatedReview = await review.save();
    res.json(updatedReview);
  } else {
    throw new AppError(HttpStatus.NOT_FOUND, 'Review not found');
  }
});

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private/Admin
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (review) {
    await Review.deleteOne({ _id: req.params.id });
    res.json({ message: 'Review removed' });
  } else {
    throw new AppError(HttpStatus.NOT_FOUND, 'Review not found');
  }
});

export {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};
