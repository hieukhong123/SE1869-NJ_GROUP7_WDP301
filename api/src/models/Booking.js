import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
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
		extraIds: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'ExtraFee',
			},
		],
		name: {
			type: String,
			required: true,
		},
		adult: {
			type: Number,
			required: true,
		},
		children: {
			type: Number,
			default: 0,
		},
		baby: {
			type: Number,
			default: 0,
		},
		phone: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		bookAt: {
			type: Date,
			default: Date.now,
		},
		checkOut: {
			type: Date,
		},
		status: {
			type: String,
			default: 'pending',
			enum: ['pending', 'confirmed', 'cancelled'],
		},
		toltalAmount: {
			type: Number,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);
