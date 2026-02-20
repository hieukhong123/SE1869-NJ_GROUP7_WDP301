import express from 'express';
import { getPayments } from '../controllers/paymentController.js';

const router = express.Router();

router.route('/').get(getPayments);

export default router;
