import { catchAsync } from '../middlewares/errorMiddleware.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = catchAsync(async (req, res) => {
	const users = await User.find({});
	res.status(HttpStatus.OK).json({
		success: true,
		data: users,
	});
});

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private/Admin
const getUserById = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.params.id).select('-password');

	if (user) {
		res.status(HttpStatus.OK).json({
			success: true,
			data: user,
		});
	} else {
		return next(new AppError(HttpStatus.NOT_FOUND, 'User not found'));
	}
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
const updateUser = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (user) {
		user.fullName = req.body.fullName || user.fullName;
		user.email = req.body.email || user.email;
		user.role = req.body.role || user.role;
		user.status = req.body.status;

		const updatedUser = await user.save();

		res.status(HttpStatus.OK).json({
			success: true,
			data: updatedUser,
		});
	} else {
		return next(new AppError(HttpStatus.NOT_FOUND, 'User not found'));
	}
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (user) {
		const hasBookings = await Booking.exists({ userId: req.params.id });
		if (hasBookings) {
			return next(
				new AppError(
					HttpStatus.BAD_REQUEST,
					'Cannot delete user who has booking history. Please set to inactive instead.',
				),
			);
		}

		await User.deleteOne({ _id: req.params.id });
		res.status(HttpStatus.OK).json({
			success: true,
			message: 'User removed',
		});
	} else {
		return next(new AppError(HttpStatus.NOT_FOUND, 'User not found'));
	}
});

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private/Admin
const createUser = catchAsync(async (req, res, next) => {
	const { userName, email, password, fullName, phone, dob, address, role } =
		req.body;

	const userExists = await User.findOne({ email });

	if (userExists) {
		return next(
			new AppError(HttpStatus.BAD_REQUEST, 'User already exists'),
		);
	}

	// Hash password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	const user = await User.create({
		userName,
		email,
		password: hashedPassword,
		fullName,
		phone,
		dob,
		address,
		role,
	});

	if (user) {
		res.status(HttpStatus.CREATED).json({
			success: true,
			data: user,
		});
	} else {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Invalid user data'));
	}
});

// @desc    Register new user
// @route   POST /api/v1/users/register
// @access  Public
const registerUser = catchAsync(async (req, res, next) => {
	const { userName, email, password, fullName, phone } = req.body;

	// Validate required fields
	if (!userName || !email || !password) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Please provide username, email and password',
			),
		);
	}

	// Check if user already exists
	const userExists = await User.findOne({ $or: [{ email }, { userName }] });

	if (userExists) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'User with this email or username already exists',
			),
		);
	}

	// Hash password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	// Create user with default role 'user'
	const user = await User.create({
		userName,
		email,
		password: hashedPassword,
		fullName,
		phone,
		role: 'user',
		status: true,
	});

	if (user) {
		const userResponse = {
			_id: user._id,
			userName: user.userName,
			email: user.email,
			fullName: user.fullName,
			phone: user.phone,
			role: user.role,
		};

		res.status(HttpStatus.CREATED).json({
			success: true,
			message: 'User registered successfully',
			data: userResponse,
		});
	} else {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Invalid user data'));
	}
});

// @desc    Login user
// @route   POST /api/v1/users/login
// @access  Public
const loginUser = catchAsync(async (req, res, next) => {
	const { username, password } = req.body;

	// Validate required fields
	if (!username || !password) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Please provide username or email and password',
			),
		);
	}

	// Find user by username or email
	const user = await User.findOne({
		$or: [{ userName: username }, { email: username }],
	});

	if (!user) {
		return next(
			new AppError(
				HttpStatus.UNAUTHORIZED,
				'Invalid username/email or password',
			),
		);
	}

	// Check if user is active
	if (!user.status) {
		return next(
			new AppError(
				HttpStatus.FORBIDDEN,
				'Your account has been deactivated. Please contact support.',
			),
		);
	}

	// Check password
	const isPasswordValid = await bcrypt.compare(password, user.password);

	if (!isPasswordValid) {
		return next(
			new AppError(
				HttpStatus.UNAUTHORIZED,
				'Invalid username/email or password',
			),
		);
	}

	// Return user data (excluding password)
	const userResponse = {
		_id: user._id,
		userName: user.userName,
		email: user.email,
		fullName: user.fullName,
		phone: user.phone,
		address: user.address,
		role: user.role,
		avatar: user.avartar,
	};

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Login successful',
		data: userResponse,
	});
});

// @desc    Send password reset email
// @route   POST /api/v1/users/forgot-password
// @access  Public
const forgotPassword = catchAsync(async (req, res, next) => {
	const { email } = req.body;

	// Validate email
	if (!email) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Please provide email address',
			),
		);
	}

	// Find user by email
	const user = await User.findOne({ email });

	if (!user) {
		return next(
			new AppError(
				HttpStatus.NOT_FOUND,
				'No user found with that email address',
			),
		);
	}

	// Generate reset token (6-digit code)
	const resetToken = crypto.randomInt(100000, 999999).toString();

	// Hash token and save to database
	user.resetPasswordToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	// Token expires in 10 minutes
	user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

	await user.save();

	// Send email
	try {
		const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #f59e0b;">Reset Your Password</h2>
				<p>Hello ${user.fullName || user.userName},</p>
				<p>You requested to reset your password. Please use the verification code below:</p>
				<div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
					<h1 style="color: #f59e0b; margin: 0; font-size: 36px; letter-spacing: 5px;">${resetToken}</h1>
				</div>
				<p>Or click the link below to reset your password:</p>
				<p><a href="${resetUrl}" style="color: #f59e0b;">Reset Password</a></p>
				<p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
				<p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
				<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
				<p style="color: #9ca3af; font-size: 12px;">Roomerang - Hotel Booking System</p>
			</div>
		`;

		await sendEmail({
			email: user.email,
			subject: 'Password Reset Request - Roomerang',
			html,
		});

		res.status(HttpStatus.OK).json({
			success: true,
			message:
				'Password reset email sent successfully. Please check your email.',
		});
	} catch (error) {
		// Clear reset token if email fails
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		await user.save();

		return next(
			new AppError(
				HttpStatus.INTERNAL_SERVER_ERROR,
				'Email could not be sent. Please try again later.',
			),
		);
	}
});

// @desc    Reset password with token
// @route   POST /api/v1/users/reset-password
// @access  Public
const resetPassword = catchAsync(async (req, res, next) => {
	const { token, newPassword } = req.body;

	// Validate required fields
	if (!token || !newPassword) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Please provide verification code and new password',
			),
		);
	}

	// Validate password length
	if (newPassword.length < 6) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Password must be at least 6 characters',
			),
		);
	}

	// Hash token to compare with database
	const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

	// Find user with valid token
	const user = await User.findOne({
		resetPasswordToken: hashedToken,
		resetPasswordExpires: { $gt: Date.now() },
	});

	if (!user) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Invalid or expired verification code',
			),
		);
	}

	// Hash new password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(newPassword, salt);

	// Update user password and clear reset token
	user.password = hashedPassword;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	await user.save();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Password has been reset successfully',
	});
});

// @desc    Toggle user status
// @route   PUT /api/v1/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.params.id);

	if (user) {
		user.status = !user.status;
		await user.save();
		res.status(HttpStatus.OK).json({
			success: true,
			message: 'User status updated',
		});
	} else {
		return next(new AppError(HttpStatus.NOT_FOUND, 'User not found'));
	}
});

// @desc    Get current user profile
// @route   GET /api/v1/users/profile/:userId
// @access  Public (user accesses their own profile)
const getUserProfile = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.params.userId).select(
		'-password -resetPasswordToken -resetPasswordExpires',
	);

	if (!user) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'User not found'));
	}

	res.status(HttpStatus.OK).json({
		success: true,
		data: user,
	});
});

// @desc    Update current user profile
// @route   PUT /api/v1/users/profile/:userId
// @access  Public (user updates their own profile)
const updateUserProfile = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.params.userId);

	if (!user) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'User not found'));
	}

	// Fields that user can update
	const allowedUpdates = ['fullName', 'phone', 'dob', 'address', 'avartar'];

	// Update only allowed fields
	allowedUpdates.forEach((field) => {
		if (req.body[field] !== undefined) {
			user[field] = req.body[field];
		}
	});

	const updatedUser = await user.save();

	// Return updated user without password
	const userResponse = {
		_id: updatedUser._id,
		userName: updatedUser.userName,
		email: updatedUser.email,
		fullName: updatedUser.fullName,
		phone: updatedUser.phone,
		dob: updatedUser.dob,
		address: updatedUser.address,
		role: updatedUser.role,
		avartar: updatedUser.avartar,
	};

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Profile updated successfully',
		data: userResponse,
	});
});

// @desc    Change user password
// @route   PUT /api/v1/users/change-password/:userId
// @access  Public (user changes their own password)
const changePassword = catchAsync(async (req, res, next) => {
	const { currentPassword, newPassword } = req.body;

	// Validate required fields
	if (!currentPassword || !newPassword) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'Please provide current password and new password',
			),
		);
	}

	// Validate new password length
	if (newPassword.length < 6) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'New password must be at least 6 characters',
			),
		);
	}

	// Find user with password field
	const user = await User.findById(req.params.userId);

	if (!user) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'User not found'));
	}

	// Verify current password
	const isPasswordValid = await bcrypt.compare(
		currentPassword,
		user.password,
	);

	if (!isPasswordValid) {
		return next(
			new AppError(
				HttpStatus.UNAUTHORIZED,
				'Current password is incorrect',
			),
		);
	}

	// Hash new password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(newPassword, salt);

	// Update password
	user.password = hashedPassword;
	await user.save();

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Password changed successfully',
	});
});

export {
	getUsers,
	getUserById,
	updateUser,
	deleteUser,
	createUser,
	registerUser,
	loginUser,
	forgotPassword,
	resetPassword,
	toggleUserStatus,
	getUserProfile,
	updateUserProfile,
	changePassword,
};
