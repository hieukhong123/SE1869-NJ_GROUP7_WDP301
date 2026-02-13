import { HttpStatus } from '../utils/httpStatus.js';

export const globalErrorHandler = (err, req, res, next) => {
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
