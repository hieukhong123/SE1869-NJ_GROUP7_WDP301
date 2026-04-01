import mongoose from 'mongoose';

const extraFeeSchema = new mongoose.Schema(
	{
		hotelId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Hotel',
			required: true,
		},
		extraPrice: {
			type: Number,
			required: true,
		},
		extraName: {
			type: String,
			required: true,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('ExtraFee', extraFeeSchema);
