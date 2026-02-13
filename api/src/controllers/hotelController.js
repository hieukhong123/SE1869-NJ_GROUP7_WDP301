import Hotel from '../models/Hotel.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';

export const updateHotel = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	const updatedHotel = await Hotel.findByIdAndUpdate(
		id,
		{ $set: req.body },
		{ new: true, runValidators: true }
	);

	if (!updatedHotel) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Hotel not found with that ID')
		);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Hotel updated successfully',
		data: updatedHotel,
	});
});
