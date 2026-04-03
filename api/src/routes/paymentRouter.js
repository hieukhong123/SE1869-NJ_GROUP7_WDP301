import express from 'express';
import {
    getPayments,
    getPaymentByBookingId,
    createSepayPayment,
    getSepayCheckoutByBookingId,
    getSepayPaymentStatusByBookingId,
    sepayWebhook,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, authorize('admin', 'staff'), getPayments);
router.route('/booking/:bookingId').get(protect, getPaymentByBookingId);
router.route('/sepay/create').post(createSepayPayment);
router.route('/sepay/checkout/:bookingId').get(getSepayCheckoutByBookingId);
router.route('/sepay/status/:bookingId').get(getSepayPaymentStatusByBookingId);
router.route('/sepay/webhook').post(sepayWebhook);

// Backward compatibility for old FE call path.
router.route('/vnpay/create').post(createSepayPayment);

export default router;
