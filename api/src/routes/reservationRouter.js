import express from 'express';
import {
	createReservation,
	deleteReservation,
} from '../controllers/reservationController.js';

const router = express.Router();

router.route('/').post(createReservation);
router.route('/:id').delete(deleteReservation);

export default router;
