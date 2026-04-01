import express from 'express';
import {
	createBooking,
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

// Public routes (though some might need user auth, but for now we keep existing logic)
router.route('/').post(createBooking);
router.route('/user/:userId').get(getUserBookings);
router.route('/:id').get(getBookingById);
router.route('/:id/cancel').put(cancelBooking);
router.route('/:id/cancel-request').put(protect, requestCancelBooking);

// Protected routes
router.use(protect);

router.route('/').get(authorize('admin', 'staff'), getAllBookings);
router.route('/logs/refund').get(authorize('admin'), getRefundLogs);
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
