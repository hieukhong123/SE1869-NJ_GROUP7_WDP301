import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
	const users = await User.find({});
	res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.id).select('-password');

	if (user) {
		res.json(user);
	} else {
		throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
	}
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.id);

	if (user) {
		user.fullName = req.body.fullName || user.fullName;
		user.email = req.body.email || user.email;
		user.role = req.body.role || user.role;
		user.status = req.body.status;

		const updatedUser = await user.save();

		res.json({
			_id: updatedUser._id,
			fullName: updatedUser.fullName,
			email: updatedUser.email,
			role: updatedUser.role,
			status: updatedUser.status,
		});
	} else {
		throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
	}
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.id);

	if (user) {
		await User.deleteOne({ _id: req.params.id });
		res.json({ message: 'User removed' });
	} else {
		throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
	}
});

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
	const { userName, email, password, fullName, phone, dob, address, role } =
		req.body;

	const userExists = await User.findOne({ email });

	if (userExists) {
		throw new AppError(HttpStatus.BAD_REQUEST, 'User already exists');
	}

	const user = await User.create({
		userName,
		email,
		password, // In a real app, this should be hashed
		fullName,
		phone,
		dob,
		address,
		role,
	});

	if (user) {
		res.status(HttpStatus.CREATED).json({
			_id: user._id,
			userName: user.userName,
			email: user.email,
			fullName: user.fullName,
			role: user.role,
		});
	} else {
		throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid user data');
	}
});

// @desc    Toggle user status
// @route   PUT /api/v1/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.id);

	if (user) {
		user.status = !user.status;
		await user.save();
		res.json({ message: 'User status updated' });
	} else {
		throw new AppError(HttpStatus.NOT_FOUND, 'User not found');
	}
});

export {
	getUsers,
	getUserById,
	updateUser,
	deleteUser,
	createUser,
	toggleUserStatus,
};
