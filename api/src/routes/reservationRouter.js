import express from 'express';
import {
	createReservation,
	deleteReservation,
} from '../controllers/reservationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createReservation);
router.route('/:id').delete(protect, deleteReservation);

export default router;
