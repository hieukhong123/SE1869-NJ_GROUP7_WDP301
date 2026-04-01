import { HttpStatus } from '../utils/httpStatus.js';

export const globalErrorHandler = (err, req, res, next) => {
	if (err.name === 'JsonWebTokenError') {
		err.statusCode = HttpStatus.UNAUTHORIZED;
		err.status = 'fail';
		err.message = 'Invalid token. Please log in again.';
	}

	if (err.name === 'TokenExpiredError') {
		err.statusCode = HttpStatus.UNAUTHORIZED;
		err.status = 'fail';
		err.message = 'Session expired. Please log in again.';
	}

	err.statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
	err.status = err.status || 'error';

	console.error('ERROR', err);

	res.status(err.statusCode).json({
		success: false,
		status: err.status,
		message: err.message,
		stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
	});
};

export const catchAsync = (fn) => {
	return (req, res, next) => {
		fn(req, res, next).catch(next);
	};
};
