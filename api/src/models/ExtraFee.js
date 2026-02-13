import mongoose from 'mongoose';

const extraFeeSchema = new mongoose.Schema(
	{
		hotelId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Hotel',
			required: true,
		},
		extraPrice: {
			type: String,
			required: true,
		},
		extraName: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('ExtraFee', extraFeeSchema);
