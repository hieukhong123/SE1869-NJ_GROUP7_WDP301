import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Hotel from './src/models/Hotel.js';
import RoomCategory from './src/models/RoomCategory.js';
import Booking from './src/models/Booking.js';
import ExtraFee from './src/models/ExtraFee.js';
import Payment from './src/models/Payment.js';
import Refund from './src/models/Refund.js';
import Review from './src/models/Review.js';

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
		await ExtraFee.deleteMany({});
		await Payment.deleteMany({});
		await Refund.deleteMany({});
		await Review.deleteMany({});

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
			{
				userName: 'peter_jones',
				email: 'peter@example.com',
				password: 'hashedpassword123',
				fullName: 'Peter Jones',
				role: 'user',
				phone: '0987654321',
			},
			{
				userName: 'mary_williams',
				email: 'mary@example.com',
				password: 'hashedpassword123',
				fullName: 'Mary Williams',
				role: 'user',
				phone: '0911223344',
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
			{
				name: 'Mekong Delta Resort',
				address: '101 Can Tho River, Can Tho',
				hotelPhone: 292345678,
				hotelEmail: 'contact@mekongresort.com',
				description: 'Experience the beauty of the Mekong Delta.',
			},
			{
				name: 'Ancient Town Boutique Hotel',
				address: '22 Tran Hung Dao, Hoi An',
				hotelPhone: 235678901,
				hotelEmail: 'info@ancienttownhotel.com',
				description: 'A charming hotel in the heart of Hoi An.',
			},
		]);
		console.log(`✅ Created ${hotels.length} Hotels`);

		// Create Room Categories
		const roomCategories = await RoomCategory.insertMany([
			{
				hotelId: hotels[0]._id,
				roomName: 'Deluxe City View',
				roomPrice: 150,
				maxOccupancy: 2,
				quantity: 15,
				description: 'Spacious room with city views.',
			},
			{
				hotelId: hotels[1]._id,
				roomName: 'Ocean View King',
				roomPrice: 200,
				maxOccupancy: 2,
				quantity: 10,
				description: 'Direct ocean views with a king-size bed.',
			},
			{
				hotelId: hotels[2]._id,
				roomName: 'Standard Mountain View',
				roomPrice: 100,
				maxOccupancy: 2,
				quantity: 20,
				description: 'Cozy room with beautiful mountain scenery.',
			},
			{
				hotelId: hotels[3]._id,
				roomName: 'River View Bungalow',
				roomPrice: 180,
				maxOccupancy: 3,
				quantity: 8,
				description: 'Private bungalow with a view of the Mekong River.',
			},
			{
				hotelId: hotels[4]._id,
				roomName: 'Heritage Suite',
				roomPrice: 220,
				maxOccupancy: 2,
				quantity: 5,
				description:
					'A suite decorated in traditional Hoi An style.',
			},
		]);
		console.log(`✅ Created ${roomCategories.length} Room Categories`);

		// Create Extra Fees
		const extraFees = await ExtraFee.insertMany([
			{
				hotelId: hotels[0]._id,
				extraName: 'Airport Transfer',
				extraPrice: '25',
			},
			{
				hotelId: hotels[1]._id,
				extraName: 'Scuba Diving Trip',
				extraPrice: '100',
			},
			{
				hotelId: hotels[2]._id,
				extraName: 'Trekking Tour',
				extraPrice: '50',
			},
			{
				hotelId: hotels[3]._id,
				extraName: 'Floating Market Tour',
				extraPrice: '30',
			},
			{
				hotelId: hotels[4]._id,
				extraName: 'Cooking Class',
				extraPrice: '40',
			},
		]);
		console.log(`✅ Created ${extraFees.length} Extra Fees`);

		// Create Bookings
		const bookings = await Booking.insertMany([
			{
				userId: users[1]._id,
				hotelId: hotels[0]._id,
				roomIds: [roomCategories[0]._id],
				name: 'John Doe Business Trip',
				adult: 1,
				phone: users[1].phone,
				email: users[1].email,
				status: 'confirmed',
				totalAmount: 175,
				extraIds: [extraFees[0]._id],
				checkIn: new Date('2024-03-10'),
				checkOut: new Date('2024-03-12'),
			},
			{
				userId: users[2]._id,
				hotelId: hotels[1]._id,
				roomIds: [roomCategories[1]._id],
				name: 'Jane Smith Vacation',
				adult: 2,
				phone: users[2].phone,
				email: users[2].email,
				status: 'confirmed',
				totalAmount: 200,
				checkIn: new Date('2024-04-01'),
				checkOut: new Date('2024-04-07'),
			},
			{
				userId: users[3]._id,
				hotelId: hotels[2]._id,
				roomIds: [roomCategories[2]._id],
				name: 'Peter Jones Mountain Trip',
				adult: 1,
				phone: users[3].phone,
				email: users[3].email,
				status: 'cancelled',
				totalAmount: 100,
				checkIn: new Date('2024-03-20'),
				checkOut: new Date('2024-03-22'),
			},
			{
				userId: users[4]._id,
				hotelId: hotels[3]._id,
				roomIds: [roomCategories[3]._id],
				name: 'Mary Williams Mekong Delta Tour',
				adult: 2,
				phone: users[4].phone,
				email: users[4].email,
				status: 'pending',
				totalAmount: 180,
				checkIn: new Date('2024-05-01'),
				checkOut: new Date('2024-05-05'),
			},
			{
				userId: users[1]._id,
				hotelId: hotels[4]._id,
				roomIds: [roomCategories[4]._id],
				name: 'John Doe Hoi An Getaway',
				adult: 2,
				phone: users[1].phone,
				email: users[1].email,
				status: 'confirmed',
				totalAmount: 260,
				extraIds: [extraFees[4]._id],
				checkIn: new Date('2024-06-15'),
				checkOut: new Date('2024-06-20'),
			},
		]);
		console.log(`✅ Created ${bookings.length} Bookings`);

		// Create Payments
		const payments = await Payment.insertMany([
			{
				bookingId: bookings[0]._id,
				amount: bookings[0].totalAmount,
				status: 'confirmed',
			},
			{
				bookingId: bookings[1]._id,
				amount: bookings[1].totalAmount,
				status: 'confirmed',
			},
			{
				bookingId: bookings[2]._id,
				amount: bookings[2].totalAmount,
				status: 'cancel',
				isRefund: true,
			},
			{
				bookingId: bookings[3]._id,
				amount: bookings[3].totalAmount,
				status: 'pending',
			},
			{
				bookingId: bookings[4]._id,
				amount: bookings[4].totalAmount,
				status: 'confirmed',
			},
		]);
		console.log(`✅ Created ${payments.length} Payments`);

		// Create Refunds
		const refunds = await Refund.insertMany([
			{
				paymentId: payments[2]._id,
				bankNumber: '123456789',
				bankName: 'VCB',
				reasons: 'Cancelled by user',
			},
		]);
		console.log(`✅ Created ${refunds.length} Refunds`);

		// Create Reviews
		const reviews = await Review.insertMany([
			{
				hotelId: hotels[0]._id,
				userId: users[1]._id,
				reviewText: 'Great hotel, very clean and modern.',
				rating: 5,
			},
			{
				hotelId: hotels[1]._id,
				userId: users[2]._id,
				reviewText: 'Beautiful location, but the service was slow.',
				rating: 3,
			},
			{
				hotelId: hotels[4]._id,
				userId: users[1]._id,
				reviewText: 'Loved the traditional style of the hotel.',
				rating: 4,
			},
		]);
		console.log(`✅ Created ${reviews.length} Reviews`);

		console.log('Data Seeding Completed!');
		process.exit();
	} catch (error) {
		console.error('Seeding Failed:', error);
		process.exit(1);
	}
};

seedData();
