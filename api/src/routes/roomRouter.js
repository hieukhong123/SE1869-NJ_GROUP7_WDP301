import express from 'express';
import {
	createRoom,
	getRooms,
	updateRoom,
} from '../controllers/roomController.js';

const router = express.Router();

router.get('/', getRooms);
router.post('/', createRoom);
router.put('/:id', updateRoom);

export default router;
