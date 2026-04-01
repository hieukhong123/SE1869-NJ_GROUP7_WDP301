import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
	{
		userName: {
			type: String,
			required: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		fullName: {
			type: String,
		},
		password: {
			type: String,
			required: true,
		},
		phone: {
			type: String,
		},
		dob: {
			type: Date,
		},
		address: {
			type: String,
		},
		role: {
			type: String,
			default: 'user',
		},
                hotelId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Hotel',
                        default: null,
                },
		avartar: {
			type: String,
		},
		status: {
			type: Boolean,
			default: true,
		},
		isEmailVerified: {
			type: Boolean,
			default: true,
		},
		emailVerificationToken: {
			type: String,
		},
		emailVerificationExpires: {
			type: Date,
		},
		resetPasswordToken: {
			type: String,
		},
		resetPasswordExpires: {
			type: Date,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('User', userSchema);

