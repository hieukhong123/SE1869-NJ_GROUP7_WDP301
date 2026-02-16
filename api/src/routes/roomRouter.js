import express from 'express';
import {
	createRoom,
	getRoom,
	getRooms,
	updateRoom,
	toggleRoomStatus,
} from '../controllers/roomController.js';

const router = express.Router();

router.get('/', getRooms);
router.get('/:id', getRoom);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.put('/:id/toggleStatus', toggleRoomStatus);

export default router;
