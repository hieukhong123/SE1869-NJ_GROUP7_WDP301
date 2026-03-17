import mongoose from 'mongoose';

const roomReservationSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		hotelId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Hotel',
			required: true,
		},
		roomIds: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'RoomCategory',
			},
		],
		checkIn: { type: Date, required: true },
		checkOut: { type: Date, required: true },
		expiresAt: { type: Date, required: true },
	},
	{ timestamps: true }
);

// MongoDB auto-deletes documents whose expiresAt is in the past
roomReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RoomReservation', roomReservationSchema);
