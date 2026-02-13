import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
	{
		bookingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Booking',
			required: true,
		},
		amount: {
			type: Number,
			required: true,
		},
		paymentDate: {
			type: Date,
			default: Date.now,
		},
		status: {
			type: String,
			default: 'pending',
			enum: ['pending', 'cancel', 'confirmed'],
		},
		isRefund: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
