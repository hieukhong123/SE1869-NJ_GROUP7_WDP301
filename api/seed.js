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

		// Create Users
		const users = await User.insertMany([
			{
				userName: 'admin_user',
				email: 'admin@example.com',
				password: 'hashedpassword123', // In real app, this should be hashed
				fullName: 'Admin User',
				role: 'admin',
				phone: '0901234567',
			},
			{
				userName: 'john_doe',
				email: 'john@example.com',
				password: 'hashedpassword123',
				fullName: 'John Doe',
				role: 'user',
				phone: '0907654321',
			},
			{
				userName: 'jane_smith',
				email: 'jane@example.com',
				password: 'hashedpassword123',
				fullName: 'Jane Smith',
				role: 'user',
				phone: '0912345678',
			},
		]);
		console.log(`✅ Created ${users.length} Users`);

		// Create Hotels
		const hotels = await Hotel.insertMany([
			{
				name: 'Grand Luxury Hanoi',
				address: '123 Ba Dinh, Ha Noi',
				hotelPhone: 241234567,
				hotelEmail: 'contact@grandluxury.com',
				description: 'A 5-star experience in the heart of Hanoi.',
			},
			{
				name: 'Coastal Retreat Da Nang',
				address: '456 Vo Nguyen Giap, Da Nang',
				hotelPhone: 234567890,
				hotelEmail: 'info@coastalretreat.com',
				description: 'Relax by the beach with stunning ocean views.',
			},
			{
				name: 'Mountain Paradise Sapa',
				address: '789 Fansipan Road, Sapa',
				hotelPhone: 212345678,
				hotelEmail: 'reservations@mountainparadise.com',
				description: 'Escape to the serene mountains of Sapa.',
			},
		]);
		console.log(`✅ Created ${hotels.length} Hotels`);

		// Create Room Categories
		const roomCategories = await RoomCategory.insertMany([
			// Rooms for Grand Luxury Hanoi
			{
				hotelId: hotels[0]._id,
				roomName: 'Deluxe City View',
				roomPrice: 150,
				maxOccupancy: 2,
				quantity: 15,
				description: 'Spacious room with city views.',
				status: 'available',
			},
			{
				hotelId: hotels[0]._id,
				roomName: 'Executive Suite',
				roomPrice: 300,
				maxOccupancy: 3,
				quantity: 5,
				description: 'Luxurious suite with separate living area.',
				status: 'available',
			},
			// Rooms for Coastal Retreat Da Nang
			{
				hotelId: hotels[1]._id,
				roomName: 'Ocean View King',
				roomPrice: 200,
				maxOccupancy: 2,
				quantity: 10,
				description: 'Direct ocean views with a king-size bed.',
				status: 'available',
			},
			{
				hotelId: hotels[1]._id,
				roomName: 'Family Bungalow',
				roomPrice: 400,
				maxOccupancy: 4,
				quantity: 3,
				description: 'Two-bedroom bungalow perfect for families.',
				status: 'available',
			},
			// Rooms for Mountain Paradise Sapa
			{
				hotelId: hotels[2]._id,
				roomName: 'Standard Mountain View',
				roomPrice: 100,
				maxOccupancy: 2,
				quantity: 20,
				description: 'Cozy room with beautiful mountain scenery.',
				status: 'available',
			},
			{
				hotelId: hotels[2]._id,
				roomName: 'Premium Balcony Room',
				roomPrice: 250,
				maxOccupancy: 2,
				quantity: 8,
				description: 'Enjoy panoramic mountain views from your private balcony.',
				status: 'available',
			},
		]);
		console.log(`✅ Created ${roomCategories.length} Room Categories`);

		// Create Bookings
		const bookings = await Booking.insertMany([
			{
				userId: users[1]._id, // John Doe
				hotelId: hotels[0]._id, // Grand Luxury Hanoi
				roomIds: [roomCategories[0]._id], // Deluxe City View
				name: 'Business Trip',
				adult: 1,
				phone: users[1].phone,
				email: users[1].email,
				status: 'confirmed',
				totalAmount: 150,
				checkIn: new Date('2024-03-10'),
				checkOut: new Date('2024-03-12'),
			},
			{
				userId: users[2]._id, // Jane Smith
				hotelId: hotels[1]._id, // Coastal Retreat Da Nang
				roomIds: [roomCategories[2]._id, roomCategories[3]._id], // Ocean View King & Family Bungalow
				name: 'Family Vacation',
				adult: 4,
				phone: users[2].phone,
				email: users[2].email,
				status: 'pending',
				totalAmount: 600, // 200 + 400
				checkIn: new Date('2024-04-01'),
				checkOut: new Date('2024-04-07'),
			},
			{
				userId: users[0]._id, // Admin User
				hotelId: hotels[2]._id, // Mountain Paradise Sapa
				roomIds: [roomCategories[4]._id], // Standard Mountain View
				name: 'Weekend Getaway',
				adult: 2,
				phone: users[0].phone,
				email: users[0].email,
				status: 'cancelled',
				totalAmount: 100,
				checkIn: new Date('2024-03-20'),
				checkOut: new Date('2024-03-22'),
			},
		]);
		console.log(`✅ Created ${bookings.length} Bookings`);

		console.log('Data Seeding Completed!');
		process.exit();
	} catch (error) {
		console.error('Seeding Failed:', error);
		process.exit(1);
	}
};

seedData();
