import express from 'express';
import {
	createRoom,
	getRoom,
	getRooms,
	updateRoom,
	toggleRoomStatus,
	deleteRoom,
} from '../controllers/roomController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.route('/').get(getRooms);
router.route('/:id').get(getRoom);

// Protected routes
router.use(protect);

router.route('/').post(authorize('admin', 'staff'), createRoom);
router.route('/:id').put(authorize('admin', 'staff'), updateRoom);
router.route('/:id').delete(authorize('admin', 'staff'), deleteRoom);
router.put('/:id/toggleStatus', authorize('admin', 'staff'), toggleRoomStatus);

export default router;
