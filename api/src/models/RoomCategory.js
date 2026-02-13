import mongoose from 'mongoose';

const roomCategorySchema = new mongoose.Schema(
	{
		hotelId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Hotel',
			required: true,
		},
		roomName: {
			type: String,
			required: true,
		},
		roomPrice: {
			type: Number,
			required: true,
		},
		maxOccupancy: {
			type: Number,
			required: true,
		},
		description: {
			type: String,
		},
		quantity: {
			type: Number,
			default: 1,
		},
		status: {
			type: String,
			default: 'available',
			enum: ['available', 'unavailable'],
		},
		photo: {
			type: String,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('RoomCategory', roomCategorySchema);
