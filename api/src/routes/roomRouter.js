import express from 'express';
import {
	createRoom,
	getRoom,
	getRooms,
	getAdminRooms,
	getAdminRoomById,
	updateRoom,
	toggleRoomStatus,
	deleteRoom,
} from '../controllers/roomController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.route('/').get(getRooms);

// Protected read routes for admin/staff
router
	.route('/admin')
	.get(protect, authorize('admin', 'staff'), getAdminRooms);
router
	.route('/admin/:id')
	.get(protect, authorize('admin', 'staff'), getAdminRoomById);

router.route('/:id').get(getRoom);

// Protected routes
router.use(protect);

router.route('/').post(authorize('admin', 'staff'), createRoom);
router.route('/:id').put(authorize('admin', 'staff'), updateRoom);
router.route('/:id').delete(authorize('admin', 'staff'), deleteRoom);
router.put('/:id/toggleStatus', authorize('admin', 'staff'), toggleRoomStatus);

export default router;
