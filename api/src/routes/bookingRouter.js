import express from 'express';
import { getAllBookings } from '../controllers/bookingController.js';

const router = express.Router();

router.get('/', getAllBookings);

export default router;
