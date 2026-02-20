import express from 'express';
import { getRefunds } from '../controllers/refundController.js';

const router = express.Router();

router.route('/').get(getRefunds);

export default router;
