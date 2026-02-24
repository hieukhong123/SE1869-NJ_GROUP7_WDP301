import express from 'express';
import {
	getHotels,
	createHotel,
	getHotel,
	updateHotel,
	deleteHotel,
	getFeaturedHotels,
} from '../controllers/hotelController.js';

const router = express.Router();

router.route('/').get(getHotels).post(createHotel);
router.route('/featured').get(getFeaturedHotels);
router.route('/:id').get(getHotel).put(updateHotel).delete(deleteHotel);

export default router;
