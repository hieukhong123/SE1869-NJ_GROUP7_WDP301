import FavoriteHotel from '../models/FavoriteHotel.js';
import Hotel from '../models/Hotel.js';
import AppError from '../utils/AppError.js';
import { HttpStatus } from '../utils/httpStatus.js';
import { catchAsync } from '../middlewares/errorMiddleware.js';

export const addFavoriteHotel = catchAsync(async (req, res, next) => {
	const { hotelId } = req.body;
	const userId = req.user?._id || req.body.userId;

	if (!hotelId) {
		return next(new AppError(HttpStatus.BAD_REQUEST, 'Hotel ID is required'));
	}

	// Check if hotel exists and is active
	const hotel = await Hotel.findOne({ _id: hotelId, status: { $ne: false } });
	if (!hotel) {
		return next(new AppError(HttpStatus.NOT_FOUND, 'Hotel not found'));
	}

	// Check if already favorited
	const existing = await FavoriteHotel.findOne({ userId, hotelId });
	if (existing) {
		return next(
			new AppError(HttpStatus.CONFLICT, 'Hotel already in favorites')
		);
	}

	const favorite = await FavoriteHotel.create({ userId, hotelId });

	res.status(HttpStatus.CREATED).json({
		success: true,
		message: 'Hotel added to favorites',
		data: favorite,
	});
});

export const removeFavoriteHotel = catchAsync(async (req, res, next) => {
	const { hotelId } = req.params;
	const userId = req.user?._id || req.query.userId;

	const favorite = await FavoriteHotel.findOneAndDelete({ userId, hotelId });

	if (!favorite) {
		return next(
			new AppError(HttpStatus.NOT_FOUND, 'Favorite hotel not found')
		);
	}

	res.status(HttpStatus.OK).json({
		success: true,
		message: 'Hotel removed from favorites',
	});
});

export const getFavoriteHotels = catchAsync(async (req, res, next) => {
	const userId = req.user?._id || req.query.userId;

	const favorites = await FavoriteHotel.find({ userId })
		.populate({ path: 'hotelId', match: { status: { $ne: false } } });

	const hotels = favorites.map((fav) => fav.hotelId).filter(Boolean);

	res.status(HttpStatus.OK).json({
		success: true,
		count: hotels.length,
		data: hotels,
	});
});

export const checkFavoriteStatus = catchAsync(async (req, res, next) => {
	const { hotelId } = req.params;
	const userId = req.user?._id || req.query.userId;

	const favorite = await FavoriteHotel.findOne({ userId, hotelId });

	res.status(HttpStatus.OK).json({
		success: true,
		isFavorite: !!favorite,
	});
});
