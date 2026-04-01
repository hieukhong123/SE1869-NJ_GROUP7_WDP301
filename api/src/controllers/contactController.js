import { catchAsync } from '../middlewares/errorMiddleware.js';
import { HttpStatus } from '../utils/httpStatus.js';
import sendEmail from '../utils/sendEmail.js';
import AppError from '../utils/AppError.js';
import Contact from '../models/Contact.js';

export const sendContactMessage = catchAsync(async (req, res, next) => {
	const { name, email, message, hotelId } = req.body;

	if (!name || !email || !message) {
		return next(
			new AppError(HttpStatus.BAD_REQUEST, 'All fields are required')
		);
	}

	// Email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return next(
			new AppError(HttpStatus.BAD_REQUEST, 'Invalid email address')
		);
	}

	// Save to database
	await Contact.create({ name, email, message, hotelId: hotelId || null });

	try {
		// Send email to admin
		await sendEmail({
			to: process.env.ADMIN_EMAIL || 'roomerangcorp@gmail.com',
			subject: `New Contact Message from ${name}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #f59e0b;">New Contact Message</h2>
					<div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
						<p><strong>Name:</strong> ${name}</p>
						<p><strong>Email:</strong> ${email}</p>
						<p><strong>Message:</strong></p>
						<p style="white-space: pre-wrap;">${message}</p>
					</div>
					<hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
					<p style="color: #666; font-size: 12px;">
						This message was sent from the Roomerang contact form.
					</p>
				</div>
			`,
		});

		// Send auto-reply to user
		await sendEmail({
			to: email,
			subject: 'Thank you for contacting Roomerang',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<div style="background-color: #f59e0b; padding: 20px; text-align: center;">
						<h1 style="color: white; margin: 0;">Roomerang</h1>
					</div>
					<div style="padding: 30px;">
						<h2 style="color: #333;">Thank you for reaching out!</h2>
						<p>Dear ${name},</p>
						<p>We have received your message and will get back to you as soon as possible.</p>
						<div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
							<p style="margin: 0; color: #666; font-size: 14px;"><strong>Your message:</strong></p>
							<p style="white-space: pre-wrap; color: #333;">${message}</p>
						</div>
						<p>Best regards,<br/>The Roomerang Team</p>
					</div>
					<div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
						<p>© 2026 Roomerang. All rights reserved.</p>
					</div>
				</div>
			`,
		});

	} catch (emailError) {
		// Email failure shouldn't block the response - message is already saved
		console.error('Email sending error:', emailError);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Your message has been sent successfully',
	});
});

export const getContacts = catchAsync(async (req, res) => {
	const { hotelId, status, startDate, endDate } = req.query;
	const filter = {};

	if (req.user?.role === 'staff') {
		filter.hotelId = req.user.hotelId;
	} else if (hotelId && hotelId !== 'all') {
		filter.hotelId = hotelId;
	}

	if (status && status !== 'all') {
		filter.status = status;
	}

	if (startDate || endDate) {
		filter.createdAt = {};
		if (startDate) {
			filter.createdAt.$gte = new Date(startDate);
		}
		if (endDate) {
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			filter.createdAt.$lte = end;
		}
	}

	const contacts = await Contact.find(filter)
		.populate('hotelId', 'name')
		.sort({ createdAt: -1 });
	res.status(HttpStatus.OK).json({ success: true, data: contacts });
});

export const replyToContact = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { reply } = req.body;

	if (!reply || !reply.trim()) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Reply message is required'));
	}

	const contact = await Contact.findById(id);
	if (!contact) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Contact message not found'));
	}

	if (req.user?.role === 'staff') {
		if (!contact.hotelId || contact.hotelId.toString() !== req.user.hotelId?.toString()) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}
	}

	// Send reply email to user
	await sendEmail({
		to: contact.email,
		subject: 'Response from Roomerang Support',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<div style="background-color: #f59e0b; padding: 20px; text-align: center;">
					<h1 style="color: white; margin: 0;">Roomerang</h1>
				</div>
				<div style="padding: 30px;">
					<h2 style="color: #333;">We've responded to your inquiry</h2>
					<p>Dear ${contact.name},</p>
					<div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
						<p style="margin: 0 0 8px; color: #666; font-size: 13px;"><strong>Your original message:</strong></p>
						<p style="white-space: pre-wrap; color: #666; font-size: 13px; margin: 0;">${contact.message}</p>
					</div>
					<div style="background-color: #fff8ec; border-left: 3px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
						<p style="margin: 0 0 8px; color: #666; font-size: 13px;"><strong>Our response:</strong></p>
						<p style="white-space: pre-wrap; color: #333;">${reply}</p>
					</div>
					<p>Best regards,<br/>The Roomerang Support Team</p>
				</div>
				<div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
					<p>© 2026 Roomerang. All rights reserved.</p>
				</div>
			</div>
		`,
	});

	contact.adminReply = reply.trim();
	contact.status = 'replied';
	await contact.save();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Reply sent successfully',
		data: contact,
	});
});

export const markContactRead = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const contact = await Contact.findById(id);
	if (!contact) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Contact message not found'));
	}
	if (req.user?.role === 'staff') {
		if (!contact.hotelId || contact.hotelId.toString() !== req.user.hotelId?.toString()) {
			return next(new AppError(HttpStatus.FORBIDDEN, 'Unauthorized'));
		}
	}
	if (contact.status === 'unread') {
		contact.status = 'read';
		await contact.save();
	}
	res.status(HttpStatus.OK).json({ success: true, data: contact });
});
