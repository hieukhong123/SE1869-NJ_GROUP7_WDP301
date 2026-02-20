import express from 'express';
import {
	getHotels,
	createHotel,
	getHotel,
	updateHotel,
	deleteHotel,
} from '../controllers/hotelController.js';

const router = express.Router();

router.route('/').get(getHotels).post(createHotel);
router.route('/:id').get(getHotel).put(updateHotel).delete(deleteHotel);

export default router;
