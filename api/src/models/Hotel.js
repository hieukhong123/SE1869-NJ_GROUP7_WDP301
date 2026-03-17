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
		city: {
			type: String,
			required: true,
		},
		propertyType: {
			type: String,
			enum: ['Hotel', 'Resort', 'Villa', 'Apartment', 'Homestay'],
			default: 'Hotel',
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
		photos: {
			type: [String],
			default: [],
		},
		distance: {
			type: String,
			default: '',
		},
		featured: {
			type: Boolean,
			default: false,
		},
		status: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual field for average rating
hotelSchema.virtual('averageRating', {
	ref: 'Review',
	localField: '_id',
	foreignField: 'hotelId',
});

export default mongoose.model('Hotel', hotelSchema);
