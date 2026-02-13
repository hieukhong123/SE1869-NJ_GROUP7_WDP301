import express from 'express';
import { updateHotel } from '../controllers/hotelController.js';

const router = express.Router();

router.put('/:id', updateHotel);

export default router;
