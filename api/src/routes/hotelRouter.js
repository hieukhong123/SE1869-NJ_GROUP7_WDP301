import express from 'express';
import {
	getHotels,
	getAdminHotels,
	createHotel,
	getHotel,
	updateHotel,
	deleteHotel,
	getFeaturedHotels,
	getCitiesWithCount,
	getPropertyTypes,
	updateHotelStatus,
} from '../controllers/hotelController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.route('/').get(getHotels);
router.route('/featured').get(getFeaturedHotels);
router.route('/cities').get(getCitiesWithCount);
router.route('/property-types').get(getPropertyTypes);
router.route('/:id').get(getHotel);

// Protected routes
router.use(protect);

router.route('/admin-all').get(authorize('admin'), getAdminHotels);
router.route('/').post(authorize('admin'), createHotel);
router.route('/:id/status').put(authorize('admin'), updateHotelStatus);
router.route('/:id').put(authorize('admin', 'staff'), updateHotel);
router.route('/:id').delete(authorize('admin'), deleteHotel);

export default router;
