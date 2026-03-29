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

const router = express.Router();

router.route('/').get(getAllBookings).post(createBooking);
router.route('/user/:userId').get(getUserBookings);
router.route('/logs/refund').get(getRefundLogs);
router.route('/logs/hotel-status').get(getHotelStatusLogs);
router.route('/logs/booking-status').get(getBookingStatusLogs);

router
	.route('/:id')
	.get(getBookingById)
	.put(updateBookingStatus)
	.delete(deleteBooking);
router.route('/:id/cancel').put(cancelBooking);
router.route('/:id/refund').post(processRefund);
router.route('/:id/cancel-request').put(requestCancelBooking);
router.route('/:id/cancel-request/answer').put(answerCancelRequest);

export default router;
