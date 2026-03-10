import express from 'express';
import { getRefunds, getRefundByBookingId, createRefund } from '../controllers/refundController.js';

const router = express.Router();

router.route('/').get(getRefunds).post(createRefund);
router.route('/booking/:bookingId').get(getRefundByBookingId);

export default router;
