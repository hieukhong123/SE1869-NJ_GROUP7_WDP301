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
} from '../controllers/bookingController.js';

const router = express.Router();

router.route('/').get(getAllBookings).post(createBooking);
router.route('/user/:userId').get(getUserBookings);
router
  .route('/:id')
  .get(getBookingById)
  .put(updateBookingStatus)
  .delete(deleteBooking);
router.route('/:id/cancel').put(cancelBooking);
router.route('/:id/cancel-request').put(requestCancelBooking);
router.route('/:id/cancel-request/answer').put(answerCancelRequest);

export default router;
