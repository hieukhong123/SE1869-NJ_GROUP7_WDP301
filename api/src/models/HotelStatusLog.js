import mongoose from 'mongoose';

const hotelStatusLogSchema = new mongoose.Schema(
	{
		hotelId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Hotel',
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
			required: true,
		},
	},
	{ timestamps: true },
);

export default mongoose.model('HotelStatusLog', hotelStatusLogSchema);
