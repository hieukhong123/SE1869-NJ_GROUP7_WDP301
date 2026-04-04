import mongoose from 'mongoose';

const bookingStatusLogSchema = new mongoose.Schema(
	{
		bookingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Booking',
			required: true,
		},
		oldStatus: {
			type: String,
			required: true,
		},
		newStatus: {
			type: String,
			required: true,
		},
		staffId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: false, // allow system-automated logs
		},
	},
	{ timestamps: true },
);

export default mongoose.model('BookingStatusLog', bookingStatusLogSchema);
