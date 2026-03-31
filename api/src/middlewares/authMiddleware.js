import jwt from 'jsonwebtoken';
import { catchAsync } from './errorMiddleware.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';

export const protect = catchAsync(async (req, res, next) => {
	let token;

	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return next(
			new AppError(
				HttpStatus.UNAUTHORIZED,
				'You are not logged in! Please log in to get access.',
			),
		);
	}

	// Verify token
	const decoded = jwt.verify(token, process.env.JWT_SECRET);

	// Check if user still exists
	const currentUser = await User.findById(decoded.id);
	if (!currentUser) {
		return next(
			new AppError(
				HttpStatus.UNAUTHORIZED,
				'The user belonging to this token no longer exists.',
			),
		);
	}

	// GRANT ACCESS TO PROTECTED ROUTE
	req.user = currentUser;
	next();
});

export const authorize = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new AppError(
					HttpStatus.FORBIDDEN,
					'You do not have permission to perform this action',
				),
			);
		}
		next();
	};
};
