import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import authRoute from './routes/authRouter.js';
import bookingRoute from './routes/bookingRouter.js';
import hotelRoute from './routes/hotelRouter.js';
import roomRoute from './routes/roomRouter.js';
import uploadRoute from './routes/uploadRouter.js';
import { globalErrorHandler } from './middlewares/errorMiddleware.js';
import AppError from './utils/AppError.js';
import { HttpStatus } from './utils/httpStatus.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;

const corsOption = {
	origin: true,
	credentials: true,
};

// Middlewares
app.use(express.json());
app.use(cors(corsOption));
app.use((req, res, next) => {
	console.log(
		`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
	);
	next();
});

// MongoDB connection
mongoose.set('strictQuery', false);
const connect = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('MongoDB successfully connected!');
	} catch (error) {
		console.log('MongoDB failed to connect:', error);
		process.exit(1);
	}
};

// Routes
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/hotels', hotelRoute);
app.use('/api/v1/rooms', roomRoute);
app.use('/api/v1/bookings', bookingRoute);
app.use('/api/v1/upload', uploadRoute);
app.get('/', (req, res) => {
	res.status(200).json({ message: 'Server is running!' });
});

// Handle Unhandled Routes
app.use((req, res, next) => {
	next(
		new AppError(
			HttpStatus.NOT_FOUND,
			`Can't find ${req.originalUrl} on this server!`
		)
	);
});

// Global Error Handler
app.use(globalErrorHandler);

app.listen(port, () => {
	connect();
	console.log('Server listening on port', port);
});
