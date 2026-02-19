import cloudinary from '../utils/cloudinary.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';

export const uploadImage = catchAsync(async (req, res, next) => {
	if (!req.file) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'No file uploaded.'));
	}

	const result = await cloudinary.uploader.upload(req.file.path, {
		folder: 'roomerang', // Specify a folder in Cloudinary
	});

	// Optionally remove the file from local storage after upload
	// fs.unlinkSync(req.file.path);

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Image uploaded successfully!',
		url: result.secure_url,
		public_id: result.public_id,
	});
});
