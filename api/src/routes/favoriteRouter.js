import express from 'express';
import {
	addFavoriteHotel,
	removeFavoriteHotel,
	getFavoriteHotels,
	checkFavoriteStatus,
} from '../controllers/favoriteController.js';

const router = express.Router();

router.post('/', addFavoriteHotel);
router.get('/', getFavoriteHotels);
router.get('/check/:hotelId', checkFavoriteStatus);
router.delete('/:hotelId', removeFavoriteHotel);

export default router;
