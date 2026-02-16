import express from 'express';
import { getHotels, updateHotel } from '../controllers/hotelController.js';
import { getRoom } from '../controllers/roomController.js';

const router = express.Router();

router.get('/', getHotels);
router.get('/:id', getRoom);
router.put('/:id', updateHotel);

export default router;
