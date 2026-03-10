import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Check for credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('⚠️ SMTP Credentials missing. Skipping email send.');
        return;
    }

	// Create transporter
	const transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST || 'smtp.gmail.com',
		port: process.env.EMAIL_PORT || 587,
		secure: false, 
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
