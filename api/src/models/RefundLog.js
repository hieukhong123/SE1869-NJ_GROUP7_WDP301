import mongoose from 'mongoose';

const refundLogSchema = new mongoose.Schema(
	{
		bookingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Booking',
			required: true,
		},
		reason: {
			type: String,
			required: true,
		},
		transfer_img: {
			type: String,
			required: true,
		},
		staffId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		amount: {
			type: Number,
			required: true,
		},
	},
	{ timestamps: true },
);

export default mongoose.model('RefundLog', refundLogSchema);
