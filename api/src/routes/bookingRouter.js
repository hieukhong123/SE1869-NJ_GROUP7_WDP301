import express from 'express';
import {
	createBooking,
	createManualBooking,
	getAllBookings,
	getBookingById,
	updateBookingStatus,
	deleteBooking,
	getUserBookings,
	cancelBooking,
	requestCancelBooking,
	answerCancelRequest,
	processRefund,
	getRefundLogs,
	getHotelStatusLogs,
	getBookingStatusLogs,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Online booking by customer (requires login)
router.route('/').post(protect, createBooking);
router.route('/user/:userId').get(protect, getUserBookings);
router.route('/:id').get(protect, getBookingById);
router.route('/:id/cancel').put(protect, cancelBooking);
router.route('/:id/cancel-request').put(protect, requestCancelBooking);

// Protected routes (admin/staff only)
router.use(protect);

router.route('/').get(authorize('admin', 'staff'), getAllBookings);
router.route('/manual').post(authorize('admin', 'staff'), createManualBooking);
router.route('/logs/refund').get(authorize('admin', 'staff'), getRefundLogs);
router.route('/logs/hotel-status').get(authorize('admin'), getHotelStatusLogs);
router
	.route('/logs/booking-status')
	.get(authorize('admin', 'staff'), getBookingStatusLogs);

router
	.route('/:id')
	.put(authorize('admin', 'staff'), updateBookingStatus)
	.delete(authorize('admin'), deleteBooking);

router.route('/:id/refund').post(authorize('admin', 'staff'), processRefund);
router
	.route('/:id/cancel-request/answer')
	.put(authorize('admin', 'staff'), answerCancelRequest);

export default router;
