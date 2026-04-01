import express from 'express';
import {
  getReviews,
  getAdminReviews,
  getReviewById,
  createReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(getReviews).post(protect, authorize('user', 'admin', 'staff'), createReview);
router.route('/admin').get(protect, authorize('admin', 'staff'), getAdminReviews);
router.route('/:id').get(protect, authorize('admin', 'staff'), getReviewById).delete(protect, authorize('admin', 'staff'), deleteReview);

export default router;

