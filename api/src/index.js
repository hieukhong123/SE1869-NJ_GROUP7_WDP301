import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import authRoute from './routes/authRouter.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

const corsOption = {
    origin: true,
    credentials: true,
};

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

// Middlewares
app.use(express.json());
app.use(cors(corsOption));

// Routes
app.use('/api/v1/auth', authRoute);

app.listen(port, () => {
    connect();
    console.log('Server listening on port', port);
});
