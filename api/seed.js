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
				password: 'hashedpassword123',
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
			{
				userName: 'susan_brown',
				email: 'susan@example.com',
				password: 'hashedpassword123',
				fullName: 'Susan Brown',
				role: 'user',
				phone: '0922334455',
			},
			{
				userName: 'david_miller',
				email: 'david@example.com',
				password: 'hashedpassword123',
				fullName: 'David Miller',
				role: 'user',
				phone: '0933445566',
			},
			{
				userName: 'linda_davis',
				email: 'linda@example.com',
				password: 'hashedpassword123',
				fullName: 'Linda Davis',
				role: 'user',
				phone: '0944556677',
			},
			{
				userName: 'james_wilson',
				email: 'james@example.com',
				password: 'hashedpassword123',
				fullName: 'James Wilson',
				role: 'user',
				phone: '0955667788',
			},
			{
				userName: 'patricia_moore',
				email: 'patricia@example.com',
				password: 'hashedpassword123',
				fullName: 'Patricia Moore',
				role: 'user',
				phone: '0966778899',
			},
			{
				userName: 'robert_taylor',
				email: 'robert@example.com',
				password: 'hashedpassword123',
				fullName: 'Robert Taylor',
				role: 'user',
				phone: '0977889900',
			},
			{
				userName: 'elizabeth_thomas',
				email: 'elizabeth@example.com',
				password: 'hashedpassword123',
				fullName: 'Elizabeth Thomas',
				role: 'user',
				phone: '0988990011',
			},
			{
				userName: 'michael_jackson',
				email: 'michael@example.com',
				password: 'hashedpassword123',
				fullName: 'Michael Jackson',
				role: 'user',
				phone: '0990011223',
			},
			{
				userName: 'jennifer_white',
				email: 'jennifer@example.com',
				password: 'hashedpassword123',
				fullName: 'Jennifer White',
				role: 'user',
				phone: '0901122334',
			},
			{
				userName: 'william_harris',
				email: 'william@example.com',
				password: 'hashedpassword123',
				fullName: 'William Harris',
				role: 'user',
				phone: '0912233445',
			},
			{
				userName: 'emily_clark',
				email: 'emily@example.com',
				password: 'hashedpassword123',
				fullName: 'Emily Clark',
				role: 'user',
				phone: '0923344556',
			},
			{
				userName: 'daniel_lewis',
				email: 'daniel@example.com',
				password: 'hashedpassword123',
				fullName: 'Daniel Lewis',
				role: 'user',
				phone: '0934455667',
			},
			{
				userName: 'olivia_hall',
				email: 'olivia@example.com',
				password: 'hashedpassword123',
				fullName: 'Olivia Hall',
				role: 'user',
				phone: '0945566778',
			},
			{
				userName: 'alexander_young',
				email: 'alexander@example.com',
				password: 'hashedpassword123',
				fullName: 'Alexander Young',
				role: 'user',
				phone: '0956677889',
			},
			{
				userName: 'sophia_king',
				email: 'sophia@example.com',
				password: 'hashedpassword123',
				fullName: 'Sophia King',
				role: 'user',
				phone: '0967788990',
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
			{
				name: 'Saigon Signature Hotel',
				address: '77 Nguyen Hue, Ho Chi Minh City',
				hotelPhone: 281234567,
				hotelEmail: 'reservations@saigonsignature.com',
				description: 'Luxury and style in the bustling city center.',
			},
			{
				name: 'Phu Quoc Beachfront Villas',
				address: '88 Long Beach, Phu Quoc',
				hotelPhone: 297890123,
				hotelEmail: 'contact@phuquocvillas.com',
				description: 'Private villas on a pristine tropical island.',
			},
			{
				name: 'Nha Trang Ocean Getaway',
				address: '99 Tran Phu, Nha Trang',
				hotelPhone: 258901234,
				hotelEmail: 'info@nhatranggetaway.com',
				description: 'Modern hotel with direct beach access.',
			},
			{
				name: 'Dalat Highlands Retreat',
				address: '110 Xuan Huong Lake, Da Lat',
				hotelPhone: 263456789,
				hotelEmail: 'support@dalatretreat.com',
				description: 'A peaceful retreat in the cool highlands.',
			},
			{
				name: 'Halong Bay Cruise & Hotel',
				address: '1 Tuan Chau, Ha Long',
				hotelPhone: 203567890,
				hotelEmail: 'cruise@halongbay.com',
				description: 'Stay on the water in a luxury cruise ship.',
			},
			{
				name: 'Hue Imperial Hotel',
				address: '5 Le Loi, Hue',
				hotelPhone: 234112233,
				hotelEmail: 'contact@hueimperial.com',
				description: 'Experience the ancient capital in style.',
			},
			{
				name: 'Con Dao Paradise Resort',
				address: 'Beach Front, Con Dao',
				hotelPhone: 254123456,
				hotelEmail: 'info@condaoparadise.com',
				description: 'Secluded island paradise with stunning beaches.',
			},
			{
				name: 'Vung Tau Seaside Villa',
				address: 'Tran Phu Street, Vung Tau',
				hotelPhone: 254987654,
				hotelEmail: 'bookings@vungtauvilla.com',
				description: 'Private villas with ocean views in Vung Tau.',
			},
			{
				name: 'Can Tho Floating Market Hotel',
				address: 'Cai Rang, Can Tho',
				hotelPhone: 292876543,
				hotelEmail: 'reservations@canthofloating.com',
				description:
					'Unique experience near the famous floating market.',
			},
			{
				name: 'Phan Thiet Mui Ne Resort',
				address: 'Nguyen Dinh Chieu, Phan Thiet',
				hotelPhone: 252123987,
				hotelEmail: 'contact@muineresort.com',
				description:
					'Tropical resort perfect for kitesurfing and relaxation.',
			},
			{
				name: 'Ninh Binh Eco Lodge',
				address: 'Tam Coc, Ninh Binh',
				hotelPhone: 229112233,
				hotelEmail: 'info@ninhbinhecolodge.com',
				description:
					'Eco-friendly stay amidst beautiful limestone karsts.',
			},
			{
				name: 'Hanoi Old Quarter Gem',
				address: '30 Hang Vai, Hanoi',
				hotelPhone: 243987654,
				hotelEmail: 'bookings@hanoigem.com',
				description:
					'Charming hotel in the heart of Hanoi Old Quarter.',
			},
			{
				name: 'Cat Ba Island Resort',
				address: 'Cat Ba Town, Hai Phong',
				hotelPhone: 225654321,
				hotelEmail: 'contact@catbaisland.com',
				description: 'Relaxing resort with views of Lan Ha Bay.',
			},
			{
				name: 'Quy Nhon Beach Retreat',
				address: 'Bai Xep, Quy Nhon',
				hotelPhone: 256789123,
				hotelEmail: 'info@quynhonretreat.com',
				description: 'Peaceful beachfront escape in Quy Nhon.',
			},
			{
				name: 'Vinh Long Homestay',
				address: 'An Binh Islet, Vinh Long',
				hotelPhone: 270123456,
				hotelEmail: 'stay@vinhlonghomestay.com',
				description: 'Authentic Mekong Delta homestay experience.',
			},
		]);
		console.log(`✅ Created ${hotels.length} Hotels`);

		// Create Room Categories
		const roomCategories = await RoomCategory.insertMany([
			// Grand Luxury Hanoi
			{
				hotelId: hotels[0]._id,
				roomName: 'Deluxe City View',
				roomPrice: 150,
				maxOccupancy: 2,
				quantity: 15,
				description: 'Spacious room with city views.',
			},
			// Coastal Retreat Da Nang
			{
				hotelId: hotels[1]._id,
				roomName: 'Ocean View King',
				roomPrice: 200,
				maxOccupancy: 2,
				quantity: 10,
				description: 'Direct ocean views with a king-size bed.',
			},
			// Mountain Paradise Sapa
			{
				hotelId: hotels[2]._id,
				roomName: 'Standard Mountain View',
				roomPrice: 100,
				maxOccupancy: 2,
				quantity: 20,
				description: 'Cozy room with beautiful mountain scenery.',
			},
			// Mekong Delta Resort
			{
				hotelId: hotels[3]._id,
				roomName: 'River View Bungalow',
				roomPrice: 180,
				maxOccupancy: 3,
				quantity: 8,
				description:
					'Private bungalow with a view of the Mekong River.',
			},
			// Ancient Town Boutique Hotel
			{
				hotelId: hotels[4]._id,
				roomName: 'Heritage Suite',
				roomPrice: 220,
				maxOccupancy: 2,
				quantity: 5,
				description: 'A suite decorated in traditional Hoi An style.',
			},
			// Saigon Signature Hotel
			{
				hotelId: hotels[5]._id,
				roomName: 'Signature Suite',
				roomPrice: 350,
				maxOccupancy: 2,
				quantity: 10,
				description: 'The finest suite in the city.',
			},
			// Phu Quoc Beachfront Villas
			{
				hotelId: hotels[6]._id,
				roomName: 'One-Bedroom Villa',
				roomPrice: 400,
				maxOccupancy: 2,
				quantity: 7,
				description: 'A luxurious private villa with a pool.',
			},
			// Nha Trang Ocean Getaway
			{
				hotelId: hotels[7]._id,
				roomName: 'Seafront Double',
				roomPrice: 180,
				maxOccupancy: 2,
				quantity: 25,
				description: 'A comfortable room with a sea view.',
			},
			// Dalat Highlands Retreat
			{
				hotelId: hotels[8]._id,
				roomName: 'Lake View Deluxe',
				roomPrice: 160,
				maxOccupancy: 2,
				quantity: 12,
				description:
					'A room overlooking the beautiful Xuan Huong Lake.',
			},
			// Halong Bay Cruise & Hotel
			{
				hotelId: hotels[9]._id,
				roomName: 'Ocean Cabin',
				roomPrice: 300,
				maxOccupancy: 2,
				quantity: 20,
				description: 'A cabin with a private balcony on the cruise.',
			},
			// Hue Imperial Hotel
			{
				hotelId: hotels[10]._id,
				roomName: 'Imperial Royal Suite',
				roomPrice: 280,
				maxOccupancy: 2,
				quantity: 4,
				description:
					'Luxury suite inspired by Nguyen Dynasty architecture.',
			},
			// Ninh Binh Eco Lodge
			{
				hotelId: hotels[15]._id,
				roomName: 'Bamboo Garden Lodge',
				roomPrice: 110,
				maxOccupancy: 2,
				quantity: 12,
				description: 'Sustainable lodging with private garden access.',
			},
			// Hanoi Old Quarter Gem
			{
				hotelId: hotels[16]._id,
				roomName: 'Boutique Balcony Room',
				roomPrice: 95,
				maxOccupancy: 2,
				quantity: 10,
				description:
					'Overlooking the vibrant streets of the Old Quarter.',
			},
			// Con Dao Paradise Resort
			{
				hotelId: hotels[11]._id,
				roomName: 'Beachfront Pavilion',
				roomPrice: 450,
				maxOccupancy: 4,
				quantity: 5,
				description:
					'Expansive pavilion for families right on the sand.',
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
			{
				hotelId: hotels[5]._id,
				extraName: 'City Tour',
				extraPrice: '60',
			},
			{
				hotelId: hotels[6]._id,
				extraName: 'Island Hopping',
				extraPrice: '120',
			},
			{
				hotelId: hotels[7]._id,
				extraName: 'Snorkeling Gear Rental',
				extraPrice: '20',
			},
			{
				hotelId: hotels[8]._id,
				extraName: 'Garden BBQ',
				extraPrice: '50',
			},
			{
				hotelId: hotels[9]._id,
				extraName: 'Kayaking in the Bay',
				extraPrice: '35',
			},
			{
				hotelId: hotels[10]._id,
				extraName: 'Imperial Dinner Show',
				extraPrice: '75',
			},
			{
				hotelId: hotels[15]._id,
				extraName: 'Bicycle Rental (Full Day)',
				extraPrice: '15',
			},
			{
				hotelId: hotels[16]._id,
				extraName: 'Late Check-out (until 6 PM)',
				extraPrice: '30',
			},
			{
				hotelId: hotels[5]._id,
				extraName: 'Spa & Wellness Package',
				extraPrice: '85',
			},
			{
				hotelId: hotels[0]._id,
				extraName: 'Executive Lounge Access',
				extraPrice: '45',
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
			{
				userId: users[5]._id,
				hotelId: hotels[5]._id,
				roomIds: [roomCategories[5]._id],
				name: 'Susan Brown City Break',
				adult: 2,
				phone: users[5].phone,
				email: users[5].email,
				status: 'confirmed',
				totalAmount: 410,
				extraIds: [extraFees[5]._id],
				checkIn: new Date('2024-07-01'),
				checkOut: new Date('2024-07-05'),
			},
			{
				userId: users[6]._id,
				hotelId: hotels[6]._id,
				roomIds: [roomCategories[6]._id],
				name: 'David Miller Island Escape',
				adult: 2,
				phone: users[6].phone,
				email: users[6].email,
				status: 'pending',
				totalAmount: 520,
				extraIds: [extraFees[6]._id],
				checkIn: new Date('2024-08-10'),
				checkOut: new Date('2024-08-17'),
			},
			{
				userId: users[7]._id,
				hotelId: hotels[7]._id,
				roomIds: [roomCategories[7]._id],
				name: 'Linda Davis Beach Holiday',
				adult: 1,
				phone: users[7].phone,
				email: users[7].email,
				status: 'confirmed',
				totalAmount: 180,
				checkIn: new Date('2024-09-05'),
				checkOut: new Date('2024-09-12'),
			},
			{
				userId: users[8]._id,
				hotelId: hotels[8]._id,
				roomIds: [roomCategories[8]._id],
				name: 'James Wilson Highlands Trip',
				adult: 2,
				phone: users[8].phone,
				email: users[8].email,
				status: 'cancelled',
				totalAmount: 210,
				extraIds: [extraFees[8]._id],
				checkIn: new Date('2024-10-01'),
				checkOut: new Date('2024-10-04'),
			},
			{
				userId: users[9]._id,
				hotelId: hotels[9]._id,
				roomIds: [roomCategories[9]._id],
				name: 'Patricia Moore Halong Cruise',
				adult: 2,
				phone: users[9].phone,
				email: users[9].email,
				status: 'confirmed',
				totalAmount: 335,
				extraIds: [extraFees[9]._id],
				checkIn: new Date('2024-11-11'),
				checkOut: new Date('2024-11-14'),
			},
			{
				userId: users[10]._id,
				hotelId: hotels[10]._id,
				roomIds: [roomCategories[0]._id],
				name: 'Taylor Hue Anniversary',
				adult: 2,
				phone: users[10].phone,
				email: users[10].email,
				status: 'confirmed',
				totalAmount: 355,
				extraIds: [extraFees[0]._id],
				checkIn: new Date('2024-12-20'),
				checkOut: new Date('2024-12-22'),
			},
			{
				userId: users[11]._id,
				hotelId: hotels[15]._id,
				roomIds: [roomCategories[1]._id],
				name: 'Eco Retreat Elizabeth',
				adult: 1,
				phone: users[11].phone,
				email: users[11].email,
				status: 'pending',
				totalAmount: 110,
				checkIn: new Date('2025-01-10'),
				checkOut: new Date('2025-01-12'),
			},
			{
				userId: users[12]._id,
				hotelId: hotels[16]._id,
				roomIds: [roomCategories[2]._id],
				name: 'Jackson Hanoi Visit',
				adult: 1,
				phone: users[12].phone,
				email: users[12].email,
				status: 'cancelled',
				totalAmount: 95,
				checkIn: new Date('2024-03-05'),
				checkOut: new Date('2024-03-06'),
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
			{
				bookingId: bookings[5]._id,
				amount: bookings[5].totalAmount,
				status: 'confirmed',
			},
			{
				bookingId: bookings[6]._id,
				amount: bookings[6].totalAmount,
				status: 'pending',
			},
			{
				bookingId: bookings[7]._id,
				amount: bookings[7].totalAmount,
				status: 'confirmed',
			},
			{
				bookingId: bookings[8]._id,
				amount: bookings[8].totalAmount,
				status: 'cancel',
				isRefund: true,
			},
			{
				bookingId: bookings[9]._id,
				amount: bookings[9].totalAmount,
				status: 'confirmed',
			},
			{
				bookingId: bookings[0]._id,
				amount: 355,
				status: 'confirmed',
			},
			{
				bookingId: bookings[1]._id,
				amount: 110,
				status: 'pending',
			},
			{
				bookingId: bookings[2]._id,
				amount: 95,
				status: 'cancel',
				isRefund: true,
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
			{
				paymentId: payments[8]._id,
				bankNumber: '987654321',
				bankName: 'ACB',
				reasons: 'Trip cancelled due to weather',
			},
			{
				paymentId: payments[2]._id,
				bankNumber: '555666777',
				bankName: 'Techcombank',
				reasons: 'Flight changed, unable to reach Hanoi.',
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
			{
				hotelId: hotels[5]._id,
				userId: users[5]._id,
				reviewText: 'Incredible views and amazing service!',
				rating: 5,
			},
			{
				hotelId: hotels[6]._id,
				userId: users[6]._id,
				reviewText:
					'The private villa was paradise. A bit pricey but worth it.',
				rating: 4,
			},
			{
				hotelId: hotels[7]._id,
				userId: users[7]._id,
				reviewText: 'Solid hotel for the price. Right on the beach.',
				rating: 4,
			},
			{
				hotelId: hotels[8]._id,
				userId: users[8]._id,
				reviewText:
					"The weather was bad so we couldn't do much, but the hotel itself was nice.",
				rating: 3,
			},
			{
				hotelId: hotels[9]._id,
				userId: users[9]._id,
				reviewText:
					'An unforgettable experience cruising through Halong Bay.',
				rating: 5,
			},
			{
				hotelId: hotels[10]._id,
				userId: users[10]._id,
				reviewText:
					'The Imperial Dinner was the highlight of our trip. Truly royal!',
				rating: 5,
			},
			{
				hotelId: hotels[15]._id,
				userId: users[11]._id,
				reviewText:
					'A bit far from the main road, but incredibly peaceful.',
				rating: 4,
			},
			{
				hotelId: hotels[16]._id,
				userId: users[13]._id,
				reviewText:
					'Walls are a bit thin, could hear the street noise all night.',
				rating: 2,
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
