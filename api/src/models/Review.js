import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
	{
		hotelId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Hotel',
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		reviewText: {
			type: String,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
