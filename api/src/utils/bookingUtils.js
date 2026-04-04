import Booking from '../models/Booking.js';
import RoomCategory from '../models/RoomCategory.js';
import RoomReservation from '../models/RoomReservation.js';

/**
 * Centrally check room availability considering both confirmed bookings and temporary holds.
 *
 * @param {Array} roomIds - List of RoomCategory IDs to check
 * @param {Date} start - Normalized check-in date
 * @param {Date} end - Normalized check-out date
 * @param {String} excludeReservationId - ID of a reservation to ignore (used when converting a hold to a booking)
 * @param {String} hotelId - Expected hotel ID for all requested room categories
 * @returns {Promise<Object>} - { success, error, roomPriceSubtotal }
 */
export const checkRoomAvailability = async (
	roomIds,
	start,
	end,
	excludeReservationId = null,
	hotelId = null,
) => {
	// Group requested rooms to count how many of each category are needed
	const requestedRoomCounts = {};
	roomIds.forEach((id) => {
		requestedRoomCounts[id] = (requestedRoomCounts[id] || 0) + 1;
	});

	let roomSubtotalPerNight = 0;

	// Iterate through each unique room category
	for (const [roomId, count] of Object.entries(requestedRoomCounts)) {
		const room = await RoomCategory.findById(roomId);
		
		if (!room || room.status === 'unavailable' || room.isDeleted) {
			return {
				success: false,
				error: room ? `Room category '${room.roomName}' is currently unavailable.` : 'One of the selected room categories no longer exists.',
			};
		}

		if (hotelId && room.hotelId?.toString() !== hotelId.toString()) {
			return {
				success: false,
				error: 'One or more selected room categories do not belong to the selected hotel.',
			};
		}

		// 1. Find overlapping confirmed/active bookings
		const overlappingBookingQuery = {
			roomIds: roomId,
			status: { $nin: ['cancelled', 'expired', 'no_show', 'checked_out'] },
			checkIn: { $lt: end },
			checkOut: { $gt: start },
		};

		if (hotelId) {
			overlappingBookingQuery.hotelId = hotelId;
		}

		const overlappingBookings = await Booking.find(overlappingBookingQuery);

		let bookedCount = 0;
		overlappingBookings.forEach((booking) => {
			// Ignore pending bookings that have already expired
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

		// 2. Find overlapping temporary room reservations (holds)
		const reservationQuery = {
			roomIds: roomId,
			checkIn: { $lt: end },
			checkOut: { $gt: start },
			expiresAt: { $gt: new Date() },
		};

		if (hotelId) {
			reservationQuery.hotelId = hotelId;
		}

		// If we are finalizing a booking from a reservation, don't count that reservation against itself
		if (excludeReservationId) {
			reservationQuery._id = { $ne: excludeReservationId };
		}

		const activeReservations = await RoomReservation.find(reservationQuery);
		
		let reservedCount = 0;
		activeReservations.forEach((res) => {
			reservedCount += res.roomIds.filter(
				(id) => id.toString() === roomId,
			).length;
		});

		// 3. Final calculation
		const totalUnavailable = bookedCount + reservedCount;
		if (totalUnavailable + count > room.quantity) {
			const reason = reservedCount > 0 
				? `Not enough rooms available for '${room.roomName}' (some are currently held by other customers).`
				: `Not enough rooms available for '${room.roomName}' during these dates.`;
				
			return {
				success: false,
				error: reason,
			};
		}

		roomSubtotalPerNight += Number(room.roomPrice || 0) * count;
	}

	return {
		success: true,
		roomPriceSubtotal: roomSubtotalPerNight,
	};
};
