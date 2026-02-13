import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Hotel from './src/models/Hotel.js';
import RoomCategory from './src/models/RoomCategory.js';
import Booking from './src/models/Booking.js';

dotenv.config();

const seedData = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('🌱 Connected to MongoDB...');

		// Clean Database
		await User.deleteMany({});
		await Hotel.deleteMany({});
		await RoomCategory.deleteMany({});
		await Booking.deleteMany({});

		// Create User (Required for Booking)
		const user = await User.create({
			userName: 'test_admin',
			email: 'admin@example.com',
			password: 'hashedpassword123', // In real app, this should be hashed
			fullName: 'Nguyen Van A',
			role: 'admin',
			phone: '0999999999',
		});
		console.log(`✅ Created User: ${user.userName}`);

		// Create Hotel (Row 5 target)
		const hotel = await Hotel.create({
			name: 'Grand Luxury Hanoi',
			address: '123 Ba Dinh, Ha Noi',
			hotelPhone: 241234567,
			hotelEmail: 'contact@grandluxury.com',
			description: 'A 5-star experience in the heart of Hanoi.',
			// No locationId as per instructions
		});
		console.log(`Created Hotel: ${hotel.name}`);

		// Create Room (Row 7 target)
		const room = await RoomCategory.create({
			hotelId: hotel._id,
			roomName: 'Deluxe Ocean View',
			roomPrice: 200,
			maxOccupancy: 2,
			quantity: 10,
			description: 'King size bed with ocean view',
			status: 'available',
		});
		console.log(`Created Room: ${room.roomName}`);

		// Create Booking (Row 6 target)
		const booking = await Booking.create({
			userId: user._id,
			hotelId: hotel._id,
			roomIds: [room._id],
			name: 'Summer Vacation',
			adult: 2,
			phone: 987654321,
			email: 'admin@example.com',
			status: 'pending',
			toltalAmount: 200,
		});
		console.log(`Created Booking: ${booking._id}`);

		console.log('Data Seeding Completed!');
		process.exit();
	} catch (error) {
		console.error('Seeding Failed:', error);
		process.exit(1);
	}
};

seedData();
