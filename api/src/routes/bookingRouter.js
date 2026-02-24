import express from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getUserBookings,
  cancelBooking,
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

export default router;
