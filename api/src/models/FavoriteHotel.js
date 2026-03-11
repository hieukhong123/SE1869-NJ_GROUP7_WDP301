import mongoose from 'mongoose';

const favoriteHotelSchema = new mongoose.Schema(
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
	},
	{ timestamps: true }
);

// Index to ensure a user can only favorite a hotel once
favoriteHotelSchema.index({ userId: 1, hotelId: 1 }, { unique: true });

export default mongoose.model('FavoriteHotel', favoriteHotelSchema);
