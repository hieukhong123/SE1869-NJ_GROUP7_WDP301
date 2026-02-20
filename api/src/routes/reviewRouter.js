import express from 'express';
import {
  getReviews,
  getReviewById,
  createReview,
  deleteReview,
} from '../controllers/reviewController.js';

const router = express.Router();

router.route('/').get(getReviews).post(createReview);
router.route('/:id').get(getReviewById).delete(deleteReview);

export default router;

