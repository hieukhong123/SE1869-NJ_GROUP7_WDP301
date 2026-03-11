import { catchAsync } from '../middlewares/errorMiddleware.js';
import { HttpStatus } from '../utils/httpStatus.js';
import sendEmail from '../utils/sendEmail.js';
import AppError from '../utils/AppError.js';

export const sendContactMessage = catchAsync(async (req, res, next) => {
	const { name, email, message } = req.body;

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

		res.status(HttpStatus.OK).json({
			success: true,
			message: 'Your message has been sent successfully',
		});
	} catch (error) {
		console.error('Email sending error:', error);
		return next(
			new AppError(
				HttpStatus.INTERNAL_SERVER_ERROR,
				'Failed to send email. Please try again later.'
			)
		);
	}
});
