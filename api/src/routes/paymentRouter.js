import express from 'express';
import { 
    getPayments, 
    getPaymentByBookingId, 
    createVnpayPayment, 
    vnpayReturn, 
    vnpayIpn 
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, authorize('admin', 'staff'), getPayments);
router.route('/booking/:bookingId').get(protect, getPaymentByBookingId);
router.route('/vnpay/create').post(protect, createVnpayPayment);
router.route('/vnpay/return').get(vnpayReturn);
router.route('/vnpay/ipn').get(vnpayIpn);

export default router;
