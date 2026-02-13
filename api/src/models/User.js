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
		avartar: {
			type: String,
		},
		status: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('User', userSchema);
