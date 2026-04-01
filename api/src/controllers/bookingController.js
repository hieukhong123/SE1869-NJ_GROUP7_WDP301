import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import RoomCategory from '../models/RoomCategory.js';
import RoomReservation from '../models/RoomReservation.js';
import ExtraFee from '../models/ExtraFee.js';
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
	if (!dateStr) {
		return null;
	}

	const [year, month, day] = String(dateStr)
		.split('-')
		.map((value) => Number(value));

	if (year && month && day) {
		return new Date(year, month - 1, day, 0, 0, 0, 0);
	}

	const d = new Date(dateStr);
	d.setHours(0, 0, 0, 0);
	return d;
};

const sendRefundNotificationEmail = async (booking, actorName = 'our staff') => {
	if (!booking?.email) {
		return;
	}

	const bookingCode = booking._id?.toString().slice(-8)?.toUpperCase() || 'N/A';
	const refundedAt = booking.refundInfo?.refundedAt
		? new Date(booking.refundInfo.refundedAt).toLocaleString()
		: new Date().toLocaleString();
	const transferProof = booking.refundInfo?.transfer_img;

	try {
		await sendEmail({
			email: booking.email,
			subject: `Refund Processed - Booking ${bookingCode}`,
			html: `
				<h3>Hello ${booking.name || 'Guest'},</h3>
				<p>Your refund request for booking <strong>${bookingCode}</strong> has been processed successfully.</p>
				<p><strong>Processed by:</strong> ${actorName}</p>
				<p><strong>Amount:</strong> $${Number(booking.totalAmount || 0).toLocaleString()}</p>
				<p><strong>Processed at:</strong> ${refundedAt}</p>
				${transferProof ? `<p><strong>Transfer proof:</strong> <a href="${transferProof}" target="_blank" rel="noopener noreferrer">View attachment</a></p>` : ''}
				<p>Thank you for choosing us.</p>
			`,
		});
	} catch (error) {
		console.error('Refund notification email failed:', error);
	}
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

	let roomSubtotalPerNight = 0;

	// Check availability for each unique room category in the requested date range
	for (const [roomId, count] of Object.entries(requestedRoomCounts)) {
		const room = await RoomCategory.findById(roomId);
		if (!room || room.status === 'unavailable' || room.isDeleted) {
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
			status: { $nin: ['cancelled', 'expired', 'no_show', 'checked_out'] },
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

		roomSubtotalPerNight += Number(room.roomPrice || 0) * count;
	}

	const stayNights = Math.max(
		1,
		Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
	);

	const selectedExtraIds = Array.isArray(req.body.extraIds)
		? req.body.extraIds
		: [];
	let extrasTotal = 0;

	if (selectedExtraIds.length > 0) {
		const uniqueExtraIds = [...new Set(selectedExtraIds.map((id) => id.toString()))];
		const extras = await ExtraFee.find({
			_id: { $in: uniqueExtraIds },
			isDeleted: false,
		});

		if (extras.length !== uniqueExtraIds.length) {
			return next(
				new AppError(
					HttpStatus.BAD_REQUEST,
					'Some selected additional services are no longer available.',
				),
			);
		}

		const hasCrossHotelExtra = extras.some(
			(extra) => extra.hotelId.toString() !== hotelId.toString(),
		);
		if (hasCrossHotelExtra) {
			return next(
				new AppError(
					HttpStatus.BAD_REQUEST,
					'Invalid additional service selection for this property.',
				),
			);
		}

		extrasTotal = extras.reduce(
			(sum, extra) => sum + Number(extra.extraPrice || 0),
			0,
		);
	}

	const computedTotalAmount = Number(
		(roomSubtotalPerNight * stayNights + extrasTotal).toFixed(2),
	);

	const expiresAt = activeReservation
		? activeReservation.expiresAt
		: new Date(Date.now() + 15 * 60 * 1000);

	const newBooking = await Booking.create({
		...req.body,
		totalAmount: computedTotalAmount,
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
		const { status, minPrice, maxPrice, bookingPrice } = req.query;
        const query = {};

		await Booking.updateMany(
			{
				status: 'pending',
				expiresAt: { $lt: new Date() },
			},
			{ $set: { status: 'expired' } },
		);

		if (req.query.hotelId && req.query.hotelId !== 'all') {
                query.hotelId = req.query.hotelId;
        }

		if (status && status !== 'all') {
			query.status = status;
		}

		if (bookingPrice !== undefined && bookingPrice !== '') {
			query.totalAmount = Number(bookingPrice);
		} else if (minPrice !== undefined || maxPrice !== undefined) {
			query.totalAmount = {};
			if (minPrice !== undefined && minPrice !== '') {
				query.totalAmount.$gte = Number(minPrice);
			}
			if (maxPrice !== undefined && maxPrice !== '') {
				query.totalAmount.$lte = Number(maxPrice);
			}
		}

		if (req.user && req.user.role === 'staff') {
			query.hotelId = req.user.hotelId;
		}

        const bookings = await Booking.find(query)
                .populate('hotelId', 'name status')
                .populate('userId', 'email fullName phone')
                .populate('roomIds', 'roomName')
                .sort({ createdAt: -1 });

		bookings.sort((a, b) => {
			if (a.status === 'paid' && b.status !== 'paid') {
				return -1;
			}
			if (a.status !== 'paid' && b.status === 'paid') {
				return 1;
			}

			return new Date(b.createdAt) - new Date(a.createdAt);
		});

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

	if (req.user?.role === 'staff') {
		if (booking.hotelId?._id?.toString() !== req.user.hotelId?.toString()) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}
	}

	if (req.user?.role === 'user') {
		if (booking.userId?._id?.toString() !== req.user._id?.toString()) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}
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
	const actorId = req.user?._id || staffId;

	const booking = await Booking.findById(id);

	if (!booking) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Booking not found'));
	}

	if (!status) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Status is required'));
	}

	if (req.user && req.user.role === 'staff') {
                if (booking.hotelId.toString() !== req.user.hotelId.toString()) {
			return next(new AppError(403, 'Unauthorized'));
		}
	}

	const oldStatus = booking.status;

	const validTransitions = {
		pending: ['paid'],
		paid: ['confirmed'],
		confirmed: ['checked_in', 'no_show'],
		checked_in: ['checked_out'],
		expired: [],
		cancelled: [],
		no_show: [],
	};

	const staffTransitions = {
		paid: ['confirmed'],
		confirmed: ['checked_in', 'no_show'],
		checked_in: ['checked_out'],
	};

	const allowedNextStatuses =
		req.user && req.user.role === 'staff'
			? staffTransitions[oldStatus] || []
			: validTransitions[oldStatus] || [];

	if (
		['paid', 'confirmed'].includes(oldStatus) &&
		status === 'cancelled'
	) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Paid/confirmed bookings must be cancelled through the refund workflow',
			),
		);
	}

	if (oldStatus === 'pending' && status === 'expired') {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Pending bookings are expired automatically by the system',
			),
		);
	}

	if (!allowedNextStatuses.includes(status)) {
		return next(
			new AppError(HttpStatus.BAD_REQUEST, 'Invalid status transition'),
		);
	}

	booking.status = status;
	await booking.save();

	if (oldStatus === 'paid' && status === 'confirmed' && actorId) {
		await BookingStatusLog.create({
			bookingId: id,
			oldStatus,
			newStatus: status,
			staffId: actorId,
		});
	}

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Booking status updated successfully',
		data: booking,
	});
});

export const deleteBooking = catchAsync(async (req, res, next) => {
	return next(
		new AppError(
			HttpStatus.BAD_REQUEST,
			'Booking records cannot be deleted for data integrity. Please cancel the booking instead.',
		),
	);
});

// @desc    Get bookings for a specific user
// @route   GET /api/v1/bookings/user/:userId
// @access  Public (user accesses their own bookings)
export const getUserBookings = catchAsync(async (req, res, next) => {
	const { userId } = req.params;

	if (req.user?.role === 'user' && req.user._id?.toString() !== userId) {
		return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
	}

	if (req.user?.role === 'staff') {
		if (!req.user.hotelId) {
			return res.status(HttpStatus.OK).json({
				success: true,
				count: 0,
				data: [],
			});
		}

		const bookings = await Booking.find({
			userId,
			hotelId: req.user.hotelId,
		})
			.populate('hotelId', 'name location image city photos status')
			.populate('roomIds', 'roomName roomPrice')
			.populate('extraIds', 'extraName extraPrice')
			.sort({ createdAt: -1 });

		return res.status(HttpStatus.OK).json({
			success: true,
			count: bookings.length,
			data: bookings,
		});
	}

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
	const actorId = req.user?._id || staffId;

	const booking = await Booking.findById(id);

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

	if (req.user?.role === 'staff') {
		if (!req.user.hotelId) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}

		if (booking.hotelId?.toString() !== req.user.hotelId?.toString()) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}
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
		refundedBy: actorId,
	};

	await booking.save();

	await Payment.findOneAndUpdate(
		{ bookingId: booking._id },
		{ status: 'cancel', isRefund: true }
	);

	// Create log
	await RefundLog.create({
		bookingId: id,
		reason,
		transfer_img,
		staffId: actorId,
		amount: booking.totalAmount,
	});

	const actor = actorId ? await User.findById(actorId).select('fullName userName') : null;
	await sendRefundNotificationEmail(
		booking,
		actor?.fullName || actor?.userName || 'our staff',
	);

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Booking refunded successfully',
		data: booking,
	});
});

export const getRefundLogs = catchAsync(async (req, res, next) => {
	const { hotelId, actorId, staffId } = req.query;
	const query = {};
	const performerId = actorId || staffId;

	if (performerId && performerId !== 'all') {
		query.staffId = performerId;
	}

	let scopedHotelId = null;

	if (req.user?.role === 'staff') {
		scopedHotelId = req.user.hotelId;
	} else if (hotelId && hotelId !== 'all') {
		scopedHotelId = hotelId;
	}

	if (req.user?.role === 'staff' && !scopedHotelId) {
		query.bookingId = { $in: [] };
	}

	if (scopedHotelId) {
		const bookingIds = await Booking.find({ hotelId: scopedHotelId }).distinct(
			'_id',
		);
		query.bookingId = { $in: bookingIds };
	}

	const logs = await RefundLog.find(query)
		.populate({
			path: 'bookingId',
			select: 'hotelId userId checkIn checkOut totalAmount email name',
			populate: [
				{ path: 'hotelId', select: 'name' },
				{ path: 'userId', select: 'fullName email phone' },
			],
		})
		.populate('staffId', 'fullName userName')
		.sort({ createdAt: -1 });

	res.status(HttpStatus.OK).json({
		success: true,
		data: logs,
	});
});

export const getHotelStatusLogs = catchAsync(async (req, res, next) => {
	const { hotelId, actorId, staffId } = req.query;
	const query = {};
	const performerId = actorId || staffId;

	if (hotelId && hotelId !== 'all') {
		query.hotelId = hotelId;
	}

	if (performerId && performerId !== 'all') {
		query.staffId = performerId;
	}

	const logs = await HotelStatusLog.find(query)
		.populate('hotelId', 'name')
		.populate('staffId', 'fullName userName')
		.sort({ createdAt: -1 });

	res.status(HttpStatus.OK).json({
		success: true,
		data: logs,
	});
});

export const getBookingStatusLogs = catchAsync(async (req, res, next) => {
	const { hotelId, actorId, staffId } = req.query;
	const query = {};
	const performerId = actorId || staffId;

	if (performerId && performerId !== 'all') {
		query.staffId = performerId;
	}

	if (req.user?.role === 'staff') {
		const bookingIds = await Booking.find({
			hotelId: req.user.hotelId,
		}).distinct('_id');
		query.bookingId = { $in: bookingIds };
	} else if (hotelId && hotelId !== 'all') {
		const bookingIds = await Booking.find({ hotelId }).distinct('_id');
		query.bookingId = { $in: bookingIds };
	}

	const logs = await BookingStatusLog.find(query)
		.populate({
			path: 'bookingId',
			select: 'hotelId userId checkIn checkOut totalAmount email name',
			populate: [
				{ path: 'hotelId', select: 'name' },
				{ path: 'userId', select: 'fullName email phone' },
			],
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

	if (req.user?.role === 'user') {
		if (booking.userId?.toString() !== req.user._id?.toString()) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}
	}

	if (req.user?.role === 'staff') {
		if (booking.hotelId?.toString() !== req.user.hotelId?.toString()) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}
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

	// Only allow cancellation if status is pending
	if (booking.status !== 'pending') {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Paid or confirmed bookings cannot be cancelled directly. Please request a cancellation instead.',
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

	if (!['paid', 'confirmed'].includes(booking.status)) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Only paid or confirmed bookings can be requested for cancellation/refund',
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
		message: 'Cancellation/refund request submitted successfully',
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

	if (!['pending', 'paid', 'confirmed'].includes(booking.status)) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Cannot cancel this booking'));
	}

	if (req.user?.role === 'staff') {
		if (booking.hotelId?.toString() !== req.user.hotelId?.toString()) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}
	}

	if (action === 'Accept') {
		if (['paid', 'confirmed'].includes(booking.status)) {
			const { transfer_img } = req.body;
			if (!transfer_img) {
				return next(
					new AppError(
						HttpStatus.BAD_REQUEST,
						'Bank transfer proof (transfer_img) is required to accept cancellation for a paid/confirmed booking',
					),
				);
			}
			booking.refundInfo = {
				reason: booking.cancellationRequest.reason,
				transfer_img,
				refundedAt: new Date(),
				refundedBy: req.user._id, // use authenticated staff/admin
			};

			await Payment.findOneAndUpdate(
				{ bookingId: booking._id },
				{ status: 'cancel', isRefund: true }
			);

			await RefundLog.create({
				bookingId: booking._id,
				reason: booking.cancellationRequest.reason,
				transfer_img,
				staffId: req.user._id,
				amount: booking.totalAmount,
			});

			await sendRefundNotificationEmail(
				booking,
				req.user?.fullName || req.user?.userName || 'our staff',
			);
		}

		booking.status = 'cancelled';
		booking.cancellationRequest.status = 'Accepted';
		booking.cancellationRequest.adminReplyReason = adminReplyReason || '';
	}
 else if (action === 'Reject') {
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




