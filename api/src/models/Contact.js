import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, trim: true, lowercase: true },
		message: { type: String, required: true, trim: true },
		status: {
			type: String,
			enum: ['unread', 'read', 'replied'],
			default: 'unread',
		},
		adminReply: { type: String, default: '' },
	},
	{ timestamps: true }
);

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
