import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import RoomCategory from '../models/RoomCategory.js';
import RoomReservation from '../models/RoomReservation.js';
import RefundLog from '../models/RefundLog.js';
import HotelStatusLog from '../models/HotelStatusLog.js';
import BookingStatusLog from '../models/BookingStatusLog.js';
import { HttpStatus } from '../utils/httpStatus.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';
import AppError from '../utils/AppError.js';
import sendEmail from '../utils/sendEmail.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';

// Helper to normalize date to start of day (midnight) in local time
const normalizeDate = (dateStr) => {
	const d = new Date(dateStr);
	d.setHours(0, 0, 0, 0);
	return d;
};

export const createBooking = catchAsync(async (req, res, next) => {
	const { hotelId, roomIds, checkIn, checkOut } = req.body;
	const start = normalizeDate(checkIn);
	const end = normalizeDate(checkOut);

	// Check if hotel is active
	const hotel = await Hotel.findById(hotelId);
	if (!hotel || hotel.status !== 'active') {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'This hotel is no longer available for booking',
			),
		);
	}

	// Validate the temporary reservation if provided
	let activeReservation = null;
	if (req.body.reservationId) {
		activeReservation = await RoomReservation.findById(
			req.body.reservationId,
		);
		if (!activeReservation || activeReservation.expiresAt < new Date()) {
			return next(
				new AppError(
					HttpStatus.BAD_REQUEST,
					'Your room hold has expired. Please try again.',
				),
			);
		}
	}

	// Group requested rooms to check availability for each category
	const requestedRoomCounts = {};
	roomIds.forEach((id) => {
		requestedRoomCounts[id] = (requestedRoomCounts[id] || 0) + 1;
	});

	// Check availability for each unique room category in the requested date range
	for (const [roomId, count] of Object.entries(requestedRoomCounts)) {
		const room = await RoomCategory.findById(roomId);
		if (!room || room.status === 'unavailable') {
			return next(
				new AppError(
					HttpStatus.BAD_REQUEST,
					`Room category is no longer available`,
				),
			);
		}

		// Find existing bookings that overlap with this range
		const overlappingBookings = await Booking.find({
			roomIds: roomId,
			status: { $nin: ['cancelled', 'expired'] },
			checkIn: { $lt: end },
			checkOut: { $gt: start },
		});

		let bookedCount = 0;
		overlappingBookings.forEach((booking) => {
			// Ignore pending bookings that have expired but haven't been updated yet
			if (
				booking.status === 'pending' &&
				booking.expiresAt &&
				booking.expiresAt < new Date()
			) {
				return;
			}
			const countInBooking = booking.roomIds.filter(
				(id) => id.toString() === roomId,
			).length;
			bookedCount += countInBooking;
		});

		if (bookedCount + count > room.quantity) {
			return next(
				new AppError(
					HttpStatus.BAD_REQUEST,
					`Not enough rooms available for ${room.roomName} during these dates.`,
				),
			);
		}
	}

	const expiresAt = activeReservation
		? activeReservation.expiresAt
		: new Date(Date.now() + 15 * 60 * 1000);

	const newBooking = await Booking.create({
		...req.body,
		checkIn: start,
		checkOut: end,
		expiresAt,
	});

	// Release the temporary hold now that booking is confirmed
	if (activeReservation) {
		await RoomReservation.findByIdAndDelete(activeReservation._id);
	}

	const booking = await Booking.findById(newBooking._id)
		.populate('hotelId', 'name')
		.populate('roomIds', 'roomName roomPrice')
		.populate('extraIds', 'extraName extraPrice');

	const staffList = await User.find({
        role: 'staff',
        hotelId: hotelId,
    });

    if (staffList.length > 0) {
        await Promise.all(
            staffList.map((staff) =>
                sendEmail({
                    email: staff.email,
                    subject: `New Booking Alert - ${hotel.name}`,
                    html: `
                        <h3>Hello ${staff.fullName || 'Staff'},</h3>
                        <p>A new booking has just been created for <strong>${hotel.name}</strong>.</p>
                        <p><strong>Check-in:</strong> ${start.toLocaleDateString()}</p>
                        <p><strong>Check-out:</strong> ${end.toLocaleDateString()}</p>
                        <p>Please log in to the management portal to view details.</p>
                    `,
                })
            )
        );
    }

	res.status(HttpStatus.CREATED).json({
		success: true,
		message: 'Booking created successfully',
		data: booking,
	});
});

export const getAllBookings = catchAsync(async (req, res, next) => {
        const query = {};
        if (req.query.hotelId) {
                query.hotelId = req.query.hotelId;
        }

		if (req.user && req.user.role === 'staff') {
			query.hotelId = req.user.hotelId;
		}

        const bookings = await Booking.find(query)
                .populate('hotelId', 'name status')
                .populate('userId', 'email fullName')
                .populate('roomIds', 'roomName')
                .sort({ createdAt: -1 });

	res.status(HttpStatus.OK).json({
		success: true,
		count: bookings.length,
		data: bookings,
	});
});

export const getBookingById = catchAsync(async (req, res, next) => {
	const booking = await Booking.findById(req.params.id)
		.populate('hotelId', 'name status')
		.populate('userId', 'email fullName')
		.populate('roomIds', 'roomName')
		.populate('extraIds');

	if (!booking) {
		return next(
			new AppError(
				HttpStatus.NOT_FOUND,
				'Booking not found with that ID',
			),
		);
	}

	if (
		booking.status === 'pending' &&
		booking.expiresAt &&
		booking.expiresAt < new Date()
	) {
		booking.status = 'expired';
		await booking.save();
	}

	res.status(HttpStatus.OK).json({
		success: true,
		data: booking,
	});
});

export const updateBookingStatus = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { status, staffId } = req.body;

	const booking = await Booking.findById(id);

	if (!booking) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Booking not found'));
	}

	if (req.user && req.user.role === 'staff') {
                if (booking.hotelId.toString() !== req.user.hotelId.toString()) {
			return next(new AppError(403, 'Unauthorized'));
		}
	}

	if (!booking) {
		return next(
			new AppError(
				HttpStatus.NOT_FOUND,
				'Booking not found with that ID',
			),
		);
	}

	const oldStatus = booking.status;

	// Log transition from paid to confirmed
	if (oldStatus === 'paid' && status === 'confirmed') {
		await BookingStatusLog.create({
			bookingId: id,
			oldStatus,
			newStatus: status,
			staffId: staffId
		});
	}

	const validTransitions = {
		pending: ['paid', 'expired'],
		paid: ['confirmed', 'cancelled'],
		confirmed: ['checked_in', 'cancelled', 'no_show'],
		checked_in: ['checked_out'],
		expired: [],
		cancelled: [],
		no_show: [],
	};

	if (!validTransitions[oldStatus]?.includes(status)) {
		return next(
			new AppError(HttpStatus.BAD_REQUEST, 'Invalid status transition'),
		);
	}
	booking.status = status;
	await booking.save();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Booking status updated successfully',
		data: booking,
	});
});

export const deleteBooking = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const booking = await Booking.findByIdAndDelete(id);

	if (!booking) {
		return next(
			new AppError(
				HttpStatus.NOT_FOUND,
				'Booking not found with that ID',
			),
		);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Booking deleted successfully',
	});
});

// @desc    Get bookings for a specific user
// @route   GET /api/v1/bookings/user/:userId
// @access  Public (user accesses their own bookings)
export const getUserBookings = catchAsync(async (req, res, next) => {
	const { userId } = req.params;

	let bookings = await Booking.find({ userId })
		.populate('hotelId', 'name location image city photos status')
		.populate('roomIds', 'roomName roomPrice')
		.populate('extraIds', 'extraName extraPrice')
		.sort({ createdAt: -1 });

	// Auto-expire pending bookings
	let updated = false;
	const now = new Date();
	bookings = await Promise.all(
		bookings.map(async (booking) => {
			if (
				booking.status === 'pending' &&
				booking.expiresAt &&
				booking.expiresAt < now
			) {
				booking.status = 'expired';
				updated = true;
				return await booking.save();
			}
			return booking;
		}),
	);

	res.status(HttpStatus.OK).json({
		success: true,
		count: bookings.length,
		data: bookings,
	});
});

export const processRefund = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { reason, transfer_img, staffId } = req.body;

	const booking = await Booking.findById(id);

	if (!booking) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Booking not found'));
	}

	if (req.user && req.user.role === 'staff') {
                if (booking.hotelId.toString() !== req.user.hotelId.toString()) {
			return next(new AppError(403, 'Unauthorized'));
		}
	}

	if (!booking) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Booking not found'));
	}

	if (!['paid', 'confirmed'].includes(booking.status)) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Only paid or confirmed bookings can be refunded',
			),
		);
	}

	const now = new Date();
	const diffHours = (new Date(booking.checkIn) - now) / (1000 * 60 * 60);

	if (diffHours < 24) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Refund only allowed at least 24 hours before check-in',
			),
		);
	}

	if (!reason || !transfer_img) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Reason and transfer image are required for refund',
			),
		);
	}

	booking.status = 'cancelled';
	booking.refundInfo = {
		reason,
		transfer_img,
		refundedAt: new Date(),
		refundedBy: staffId,
	};

	await booking.save();

	await Payment.findOneAndUpdate(
		{ bookingId: booking._id },
		{ status: 'refunded' }
	);

	// Create log
	await RefundLog.create({
		bookingId: id,
		reason,
		transfer_img,
		staffId: staffId,
		amount: booking.totalAmount,
	});

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Booking refunded successfully',
		data: booking,
	});
});

export const getRefundLogs = catchAsync(async (req, res, next) => {
	const logs = await RefundLog.find()
		.populate({
			path: 'bookingId',
			populate: { path: 'hotelId', select: 'name' },
		})
		.populate('staffId', 'fullName userName')
		.sort({ createdAt: -1 });

	res.status(HttpStatus.OK).json({
		success: true,
		data: logs,
	});
});

export const getHotelStatusLogs = catchAsync(async (req, res, next) => {
	const logs = await HotelStatusLog.find()
		.populate('hotelId', 'name')
		.populate('staffId', 'fullName userName')
		.sort({ createdAt: -1 });

	res.status(HttpStatus.OK).json({
		success: true,
		data: logs,
	});
});

export const getBookingStatusLogs = catchAsync(async (req, res, next) => {
	const logs = await BookingStatusLog.find()
		.populate({
			path: 'bookingId',
			populate: { path: 'hotelId', select: 'name' },
		})
		.populate('staffId', 'fullName userName')
		.sort({ createdAt: -1 });

	res.status(HttpStatus.OK).json({
		success: true,
		data: logs,
	});
});

// @desc    Cancel a booking
// @route   PUT /api/v1/bookings/:id/cancel
// @access  Public (user can cancel their own booking)
export const cancelBooking = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	const booking = await Booking.findById(id);

	if (!booking) {
		return next(
			new AppError(
				HttpStatus.NOT_FOUND,
				'Booking not found with that ID',
			),
		);
	}

	// Check if booking is already cancelled
	if (booking.status === 'cancelled') {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Booking is already cancelled',
			),
		);
	}

	// Update status to cancelled
	booking.status = 'cancelled';
	await booking.save();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Booking cancelled successfully',
		data: booking,
	});
});

export const requestCancelBooking = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { reason } = req.body;

	const booking = await Booking.findById(id);

	if (!booking) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Booking not found'));
	}

	if (req.user && req.user.id !== booking.userId.toString()) {
		return next(new AppError(403, 'Unauthorized'));
	}

	if (!booking) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Booking not found'));
	}

	if (booking.status !== 'confirmed') {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Only confirmed bookings can be requested to cancel',
			),
		);
	}

	if (booking.checkIn <= new Date()) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Cannot cancel bookings on or after check-in date',
			),
		);
	}

	if (!reason) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Reason is required to request cancellation',
			),
		);
	}

	booking.cancellationRequest = {
		status: 'Pending',
		reason,
		requestedAt: new Date(),
	};

	await booking.save();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Cancellation request submitted successfully',
		data: booking,
	});
});

export const answerCancelRequest = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { action, adminReplyReason } = req.body; // action: 'Accept' or 'Reject'

	const booking = await Booking.findById(id);

	if (!booking) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Booking not found'));
	}

	if (
		!booking.cancellationRequest ||
		booking.cancellationRequest.status !== 'Pending'
	) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'No pending cancellation request found for this booking',
			),
		);
	}

	if (!['pending', 'paid'].includes(booking.status)) {
		return next(new AppError(400, 'Cannot cancel this booking'));
	}

	if (action === 'Accept') {
		booking.status = 'cancelled';
		booking.cancellationRequest.status = 'Accepted';
		booking.cancellationRequest.adminReplyReason = adminReplyReason || '';
	} else if (action === 'Reject') {
		if (!adminReplyReason) {
			return next(
				new AppError(
					HttpStatus.BAD_REQUEST,
					'Admin reply reason is required when rejecting a cancellation request',
				),
			);
		}
		booking.cancellationRequest.status = 'Rejected';
		booking.cancellationRequest.adminReplyReason = adminReplyReason;
	} else {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Invalid action. Must be Accept or Reject',
			),
		);
	}

	await booking.save();

	try {
		await sendEmail({
			email: booking.email,
			subject: `Booking Cancellation Request ${action}ed`,
			html: `
		<h3>Hello ${booking.name},</h3>
		<p>Your cancellation request for your booking has been <strong>${action.toLowerCase()}ed</strong>.</p>
		${adminReplyReason ? `<p><strong>Reason/Note:</strong> ${adminReplyReason}</p>` : ''}
		<p>Thank you for choosing us.</p>
	`,
		});
	} catch (error) {
		console.error('Email sending failed:', error);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		message: `Cancellation request ${action.toLowerCase()}ed successfully`,
		data: booking,
	});
});




