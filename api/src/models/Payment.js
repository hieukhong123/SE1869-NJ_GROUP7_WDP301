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
		paymentMethod: {
			type: String,
			default: 'manual',
			enum: ['manual', 'vnpay', 'sepay', 'cash', 'bank_transfer'],
		},
		paymentCode: {
			type: String,
			default: null,
		},
		externalTransactionId: {
			type: String,
			default: null,
		},
		gatewayName: {
			type: String,
			default: null,
		},
		gatewayTransactionDate: {
			type: Date,
			default: null,
		},
		gatewayPayload: {
			type: mongoose.Schema.Types.Mixed,
			default: null,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
