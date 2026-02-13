import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		address: {
			type: String,
			required: true,
		},
		hotelPhone: {
			type: Number,
			required: true,
		},
		hotelEmail: {
			type: String,
			required: true,
		},
		expiryDate: {
			type: Date,
		},
		description: {
			type: String,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('Hotel', hotelSchema);
