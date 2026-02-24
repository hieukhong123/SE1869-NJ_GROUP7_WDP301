import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
	// Create transporter
	const transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST || 'smtp.gmail.com',
		port: process.env.EMAIL_PORT || 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASSWORD,
		},
	});

	// Email options
	const mailOptions = {
		from: `${process.env.EMAIL_FROM_NAME || 'Roomerang'} <${
			process.env.EMAIL_FROM || process.env.EMAIL_USER
		}>`,
		to: options.email,
		subject: options.subject,
		html: options.html,
		text: options.text,
	};

	// Send email
	await transporter.sendMail(mailOptions);
};

export default sendEmail;
