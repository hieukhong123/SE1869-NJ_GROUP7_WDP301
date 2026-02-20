import express from 'express';
import {
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
} from '../controllers/bookingController.js';

const router = express.Router();

router.route('/').get(getAllBookings);
router
  .route('/:id')
  .get(getBookingById)
  .put(updateBookingStatus)
  .delete(deleteBooking);

export default router;
