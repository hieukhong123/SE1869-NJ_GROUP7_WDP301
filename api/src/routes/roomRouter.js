import express from 'express';
import {
	createRoom,
	getRoom,
	getRooms,
	updateRoom,
	toggleRoomStatus,
	deleteRoom,
} from '../controllers/roomController.js';

const router = express.Router();

router.route('/').get(getRooms).post(createRoom);
router.route('/:id').get(getRoom).put(updateRoom).delete(deleteRoom);
router.put('/:id/toggleStatus', toggleRoomStatus);

export default router;
