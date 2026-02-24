import { catchAsync } from '../middlewares/errorMiddleware.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';
import bcrypt from 'bcryptjs';

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
		return next(new AppError(HttpStatus.BAD_REQUEST, 'User already exists'));
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
				'Please provide username, email and password'
			)
		);
	}

	// Check if user already exists
	const userExists = await User.findOne({ $or: [{ email }, { userName }] });

	if (userExists) {
		return next(
			new AppError(
				HttpStatus.BAD_REQUEST,
				'User with this email or username already exists'
			)
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
				'Please provide username or email and password'
			)
		);
	}

	// Find user by username or email
	const user = await User.findOne({
		$or: [{ userName: username }, { email: username }]
	});

	if (!user) {
		return next(
			new AppError(HttpStatus.UNAUTHORIZED, 'Invalid username/email or password')
		);
	}

	// Check if user is active
	if (!user.status) {
		return next(
			new AppError(
				HttpStatus.FORBIDDEN,
				'Your account has been deactivated. Please contact support.'
			)
		);
	}

	// Check password
	const isPasswordValid = await bcrypt.compare(password, user.password);

	if (!isPasswordValid) {
		return next(
			new AppError(HttpStatus.UNAUTHORIZED, 'Invalid username/email or password')
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

export {
	getUsers,
	getUserById,
	updateUser,
	deleteUser,
	createUser,
	registerUser,
	loginUser,
	toggleUserStatus,
};
