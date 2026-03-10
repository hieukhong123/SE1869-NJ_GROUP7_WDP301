import express from 'express';
import { 
    getPayments, 
    getPaymentByBookingId, 
    createVnpayPayment, 
    vnpayReturn, 
    vnpayIpn 
} from '../controllers/paymentController.js';

const router = express.Router();

router.route('/').get(getPayments);
router.route('/booking/:bookingId').get(getPaymentByBookingId);
router.route('/vnpay/create').post(createVnpayPayment);
router.route('/vnpay/return').get(vnpayReturn);
router.route('/vnpay/ipn').get(vnpayIpn);

export default router;
