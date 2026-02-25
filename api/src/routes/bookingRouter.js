import express from 'express';
import {
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getUserBookings,
  cancelBooking,
} from '../controllers/bookingController.js';

const router = express.Router();

router.route('/').get(getAllBookings);
router.route('/user/:userId').get(getUserBookings);
router
  .route('/:id')
  .get(getBookingById)
  .put(updateBookingStatus)
  .delete(deleteBooking);
router.route('/:id/cancel').put(cancelBooking);

export default router;
