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

let photoCounter = 1;

/**
 * @param {number} count 
 * @param {string} keyword 
 * @returns {string[]} 
 */
const generatePhotos = (count, keyword = 'hotel,resort') => {
    return Array.from({ length: count }, () => 
        `https://loremflickr.com/800/600/${keyword}?lock=${photoCounter++}`
    );
};

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🌱 Connected to MongoDB...');

        // Clean Database
        console.log('🧹 Cleaning database...');
        await User.deleteMany({});
        await Hotel.deleteMany({});
        await RoomCategory.deleteMany({});
        await Booking.deleteMany({});
        await ExtraFee.deleteMany({});
        await Payment.deleteMany({});
        await Refund.deleteMany({});
        await Review.deleteMany({});

        // Create Users
        console.log('👤 Creating users...');
        const users = await User.insertMany([
            {
                userName: 'admin',
                email: 'admin@roomerang.vn',
                password: '$2b$10$XqcJ0Chj2j1wR0QTY.wN0uTPk0cP94odVbLOf.GTe1p674HYoZJmW',
                fullName: 'Admin',
                role: 'admin',
                phone: '0901234567',
            },
            {
                userName: 'test1',
                email: 'test1@gmail.com',
                password: '$2b$10$XqcJ0Chj2j1wR0QTY.wN0uTPk0cP94odVbLOf.GTe1p674HYoZJmW',
                fullName: 'Test User 1',
                role: 'user',
                phone: '0912345678',
            },
            {
                userName: 'test2',
                email: 'test2@gmail.com',
                password: '$2b$10$XqcJ0Chj2j1wR0QTY.wN0uTPk0cP94odVbLOf.GTe1p674HYoZJmW',
                fullName: 'Test User 2',
                role: 'user',
                phone: '0923456789',
            },
        ]);
        console.log(`✅ Created ${users.length} users`);

        // Create Hotels with detailed information
        console.log('🏨 Creating hotels...');
        const hotels = await Hotel.insertMany([
            // Hanoi Hotels
            {
                name: 'Sofitel Legend Metropole Hanoi',
                address: '15 Phố Ngô Quyền, Hoàn Kiếm',
                city: 'Hà Nội',
                propertyType: 'Hotel',
                hotelPhone: 243826919,
                hotelEmail: 'info@sofitel-metropole-hanoi.com',
                description: 'Khách sạn sang trọng 5 sao với lịch sử hơn 120 năm, nằm ở trung tâm Hà Nội. Kết hợp hoàn hảo giữa phong cách Pháp cổ điển và tiện nghi hiện đại.',
                photos: generatePhotos(20, 'hotel,luxury'),
                distance: '1 km từ Hồ Hoàn Kiếm',
                featured: true
            },
            {
                name: 'JW Marriott Hotel Hanoi',
                address: '8 Đỗ Đức Dục, Nam Từ Liêm',
                city: 'Hà Nội',
                propertyType: 'Hotel',
                hotelPhone: 243833888,
                hotelEmail: 'reservations@jwmarriothanoi.com',
                description: 'Khách sạn 5 sao hiện đại với tầm nhìn toàn thành phố, phục vụ hoàn hảo cho du khách công tác và nghỉ dưỡng.',
                photos: generatePhotos(5, 'hotel,building'),
                distance: '8 km từ Hồ Hoàn Kiếm',
                featured: true
            },
            {
                name: 'La Siesta Premium Hang Be',
                address: '94 Hàng Bè, Hoàn Kiếm',
                city: 'Hà Nội',
                propertyType: 'Hotel',
                hotelPhone: 243828999,
                hotelEmail: 'hangbe@lasiestahotels.com',
                description: 'Khách sạn boutique sang trọng nằm trong Khu phố cổ Hà Nội, gần các điểm tham quan chính.',
                photos: generatePhotos(5, 'boutique,hotel'),
                distance: '500m từ Hồ Hoàn Kiếm',
                featured: false
            },

            // Ho Chi Minh City Hotels
            {
                name: 'Park Hyatt Saigon',
                address: '2 Lam Sơn Square, Quận 1',
                city: 'Hồ Chí Minh',
                propertyType: 'Hotel',
                hotelPhone: 283824234,
                hotelEmail: 'saigon.park@hyatt.com',
                description: 'Khách sạn 5 sao đẳng cấp quốc tế tại trung tâm Sài Gòn, đối diện Nhà hát Thành phố và gần nhiều địa điểm nổi tiếng.',
                photos: generatePhotos(5, 'hotel,pool'),
                distance: '500m từ Nhà thờ Đức Bà',
                featured: true
            },
            {
                name: 'Caravelle Saigon',
                address: '19 Lam Sơn Square, Quận 1',
                city: 'Hồ Chí Minh',
                propertyType: 'Hotel',
                hotelPhone: 283823999,
                hotelEmail: 'info@caravellehotel.com',
                description: 'Biểu tượng lịch sử của Sài Gòn với vị trí đắc địa, bar trên sân thượng Saigon Saigon nổi tiếng.',
                photos: generatePhotos(5, 'hotel,city'),
                distance: '1 km từ Bến Thành Market',
                featured: true,
            },

            // Da Nang Hotels
            {
                name: 'InterContinental Danang Sun Peninsula Resort',
                address: 'Bãi Bắc, Sơn Trà',
                city: 'Đà Nẵng',
                propertyType: 'Resort',
                hotelPhone: 2363938888,
                hotelEmail: 'danang@ihg.com',
                description: 'Resort 5 sao xa hoa trên bán đảo Sơn Trà với thiết kế độc đáo của Bill Bensley, view biển tuyệt đẹp.',
                photos: generatePhotos(5, 'resort,beach'),
                distance: '15 km từ trung tâm Đà Nẵng',
                featured: true,
            },
            {
                name: 'Hyatt Regency Danang Resort and Spa',
                address: '5 Trường Sa, Hòa Hải, Ngũ Hành Sơn',
                city: 'Đà Nẵng',
                propertyType: 'Resort',
                hotelPhone: 2363981234,
                hotelEmail: 'danang.regency@hyatt.com',
                description: 'Resort biển cao cấp với bãi biển riêng, spa đẳng cấp và hồ bơi vô cực.',
                photos: generatePhotos(5, 'resort,ocean'),
                distance: '200m từ bãi biển',
                featured: false,
            },

            // Hoi An Hotels
            {
                name: 'Anantara Hoi An Resort',
                address: '1 Phố Bà Triệu',
                city: 'Hội An',
                propertyType: 'Resort',
                hotelPhone: 2353914555,
                hotelEmail: 'hoian@anantara.com',
                description: 'Resort sang trọng bên bờ sông Thu Bồn, kết hợp kiến trúc truyền thống và hiện đại.',
                photos: generatePhotos(5, 'resort,river'),
                distance: '1 km từ Phố cổ Hội An',
                featured: true,
            },
            {
                name: 'Almanity Hoi An Wellness Resort',
                address: '326 Lý Thường Kiệt, Cẩm Châu',
                city: 'Hội An',
                propertyType: 'Resort',
                hotelPhone: 2353666888,
                hotelEmail: 'info@almanityhoian.com',
                description: 'Resort chú trọng sức khỏe và wellness, với spa, yoga và ẩm thực lành mạnh.',
                photos: generatePhotos(5, 'resort,wellness'),
                distance: '2 km từ Phố cổ',
                featured: false,
            },

            // Nha Trang Hotels
            {
                name: 'Vinpearl Resort & Spa Nha Trang Bay',
                address: 'Đảo Hòn Tre, Vĩnh Nguyên',
                city: 'Nha Trang',
                propertyType: 'Resort',
                hotelPhone: 2583598188,
                hotelEmail: 'reservation@vinpearlnhatrang.com',
                description: 'Resort 5 sao trên đảo Hòn Tre với hệ thống vui chơi giải trí đa dạng, cáp treo vượt biển nổi tiếng.',
                photos: generatePhotos(5, 'resort,island'),
                distance: 'Đảo Hòn Tre',
                featured: true,
            },
            {
                name: 'Sunrise Nha Trang Beach Hotel & Spa',
                address: '12-14 Trần Phú',
                city: 'Nha Trang',
                propertyType: 'Hotel',
                hotelPhone: 2583820999,
                hotelEmail: 'info@sunrisenhatrang.com.vn',
                description: 'Khách sạn 4 sao mặt biển với hồ bơi vô cực và dịch vụ chuyên nghiệp.',
                photos: generatePhotos(5, 'hotel,beach'),
                distance: 'Mặt tiền bãi biển',
                featured: false,
            },

            // Phu Quoc Hotels
            {
                name: 'JW Marriott Phu Quoc Emerald Bay Resort & Spa',
                address: 'Khu Bãi Khem, An Thới',
                city: 'Phú Quốc',
                propertyType: 'Resort',
                hotelPhone: 2973778999,
                hotelEmail: 'info@jwphuquoc.com',
                description: 'Resort 5 sao độc đáo với thiết kế mô phỏng trường học Pháp cổ, được vinh danh nhiều giải thưởng quốc tế.',
                photos: generatePhotos(5, 'resort,architecture'),
                distance: '40 km từ sân bay',
                featured: true,
            },
            {
                name: 'Salinda Resort Phu Quoc Island',
                address: 'Cửa Lấp, Dương Tơ',
                city: 'Phú Quốc',
                propertyType: 'Resort',
                hotelPhone: 2973995895,
                hotelEmail: 'info@salindaresort.com',
                description: 'Resort cao cấp với bãi biển riêng yên tĩnh, thiết kế hiện đại và dịch vụ chu đáo.',
                photos: generatePhotos(5, 'resort,sunset'),
                distance: '25 km từ thị trấn Dương Đông',
                featured: false,
            },

            // Da Lat Hotels
            {
                name: 'Ana Mandara Villas Dalat Resort & Spa',
                address: 'Lê Lai, Phường 5',
                city: 'Đà Lạt',
                propertyType: 'Villa',
                hotelPhone: 2633555888,
                hotelEmail: 'info@anamandara-resort.com',
                description: 'Resort với 17 biệt thự Pháp cổ được tu bổ, nằm giữa rừng thông và vườn hoa tuyệt đẹp.',
                photos: generatePhotos(5, 'villa,forest'),
                distance: '2 km từ hồ Xuân Hương',
                featured: true,
            },

            // Hue Hotels
            {
                name: 'Azerai La Residence Hue',
                address: '5 Lê Lợi',
                city: 'Huế',
                propertyType: 'Hotel',
                hotelPhone: 2343837475,
                hotelEmail: 'reservations@azerai.com',
                description: 'Khách sạn sang trọng bên bờ sông Hương, với kiến trúc Art Deco độc đáo.',
                photos: generatePhotos(5, 'hotel,historic'),
                distance: '1 km từ Đại Nội',
                featured: true,
            },

            // Ha Long Hotels
            {
                name: 'Vinpearl Resort & Spa Ha Long',
                address: 'Đảo Rều, Bái Tử Long',
                city: 'Hạ Long',
                propertyType: 'Resort',
                hotelPhone: 2033861888,
                hotelEmail: 'reservation@vinpearlhalong.com',
                description: 'Resort đảo sang trọng với view vịnh Hạ Long tuyệt đẹp, trải nghiệm nghỉ dưỡng đẳng cấp.',
                photos: generatePhotos(5, 'resort,bay'),
                distance: 'Đảo riêng',
                featured: true,
            },

            // Vung Tau Hotels
            {
                name: 'Imperial Hotel Vung Tau',
                address: '159 Thùy Vân',
                city: 'Vũng Tàu',
                propertyType: 'Hotel',
                hotelPhone: 2543526888,
                hotelEmail: 'reservation@imperialvungtau.com',
                description: 'Khách sạn 5 sao với bãi biển riêng, casino và hệ thống giải trí cao cấp.',
                photos: generatePhotos(5, 'hotel,casino'),
                distance: 'Mặt tiền biển',
                featured: false,
            },
        ]);
        console.log(`✅ Created ${hotels.length} hotels`);

        // Create Room Categories
        console.log('🛏️  Creating room categories...');
        const roomCategories = await RoomCategory.insertMany([
            // Sofitel Legend Metropole Hanoi
            {
                hotelId: hotels[0]._id,
                roomName: 'Premium Room',
                roomPrice: 250,
                maxOccupancy: 2,
                quantity: 20,
                description: 'Phòng cao cấp 35m² với thiết kế Neoclassical, giường King/Twin, đầy đủ tiện nghi hiện đại.',
                photo: generatePhotos(1, 'room,bedroom')[0],
                status: 'available',
            },
            {
                hotelId: hotels[0]._id,
                roomName: 'Grand Premium Room',
                roomPrice: 320,
                maxOccupancy: 2,
                quantity: 15,
                description: 'Phòng rộng 42m² tại Opera Wing, view đẹp, có ban công, phòng tắm sang trọng.',
                photo: generatePhotos(1, 'room,bedroom')[0],
                status: 'available',
            },
            {
                hotelId: hotels[0]._id,
                roomName: 'Legend Suite',
                roomPrice: 650,
                maxOccupancy: 3,
                quantity: 8,
                description: 'Suite 80m² với phòng khách riêng, phòng ngủ lớn, phòng tắm marble, view thành phố tuyệt đẹp.',
                photo: generatePhotos(1, 'room,suite')[0],
                status: 'available',
            },

            // JW Marriott Hotel Hanoi
            {
                hotelId: hotels[1]._id,
                roomName: 'Deluxe Room',
                roomPrice: 200,
                maxOccupancy: 2,
                quantity: 25,
                description: 'Phòng 40m² hiện đại với cửa sổ lớn, view thành phố, thiết kế tối giản sang trọng.',
                photo: generatePhotos(1, 'room,bedroom')[0],
                status: 'available',
            },
            {
                hotelId: hotels[1]._id,
                roomName: 'Executive Suite',
                roomPrice: 450,
                maxOccupancy: 3,
                quantity: 10,
                description: 'Suite 75m² với phòng khách, phòng ngủ riêng, quyền sử dụng Executive Lounge.',
                photo: generatePhotos(1, 'room,suite')[0],
                status: 'available',
            },

            // La Siesta Premium Hang Be
            {
                hotelId: hotels[2]._id,
                roomName: 'Superior Room',
                roomPrice: 80,
                maxOccupancy: 2,
                quantity: 15,
                description: 'Phòng 22m² giữa lòng phố cổ, thiết kế boutique độc đáo, đầy đủ tiện nghi.',
                photo: generatePhotos(1, 'room,bedroom')[0],
                status: 'available',
            },
            {
                hotelId: hotels[2]._id,
                roomName: 'Deluxe City View',
                roomPrice: 110,
                maxOccupancy: 2,
                quantity: 12,
                description: 'Phòng 28m² với cửa sổ lớn nhìn ra phố cổ, có ban công nhỏ xinh.',
                photo: generatePhotos(1, 'room,balcony')[0],
                status: 'available',
            },

            // Park Hyatt Saigon
            {
                hotelId: hotels[3]._id,
                roomName: 'Park Room',
                roomPrice: 280,
                maxOccupancy: 2,
                quantity: 30,
                description: 'Phòng 38m² với trang trí tinh tế, giường king size, trải nghiệm sang trọng.',
                photo: generatePhotos(1, 'room,luxury')[0],
                status: 'available',
            },
            {
                hotelId: hotels[3]._id,
                roomName: 'Park Suite',
                roomPrice: 600,
                maxOccupancy: 3,
                quantity: 12,
                description: 'Suite 80m² với phòng khách rộng, view đẹp, nội thất cao cấp.',
                photo: generatePhotos(1, 'room,suite')[0],
                status: 'available',
            },

            // Caravelle Saigon
            {
                hotelId: hotels[4]._id,
                roomName: 'Superior Room',
                roomPrice: 180,
                maxOccupancy: 2,
                quantity: 40,
                description: 'Phòng 32m² với view thành phố, thiết kế sang trọng, tiện nghi đầy đủ.',
                photo: generatePhotos(1, 'room,bedroom')[0],
                status: 'available',
            },
            {
                hotelId: hotels[4]._id,
                roomName: 'Deluxe Suite',
                roomPrice: 400,
                maxOccupancy: 3,
                quantity: 15,
                description: 'Suite 65m² với phòng khách riêng, view quảng trường Lam Sơn tuyệt đẹp.',
                photo: generatePhotos(1, 'room,suite')[0],
                status: 'available',
            },

            // InterContinental Danang Sun Peninsula Resort
            {
                hotelId: hotels[5]._id,
                roomName: 'Deluxe Bay View Room',
                roomPrice: 350,
                maxOccupancy: 2,
                quantity: 20,
                description: 'Phòng 45m² với view vịnh tuyệt đẹp, thiết kế độc đáo bởi Bill Bensley.',
                photo: generatePhotos(1, 'room,oceanview')[0],
                status: 'available',
            },
            {
                hotelId: hotels[5]._id,
                roomName: 'Presidential Villa',
                roomPrice: 1500,
                maxOccupancy: 6,
                quantity: 3,
                description: 'Villa 250m² với hồ bơi riêng, view biển 180 độ, dịch vụ butler 24/7.',
                photo: generatePhotos(1, 'villa,pool')[0],
                status: 'available',
            },

            // Hyatt Regency Danang Resort and Spa
            {
                hotelId: hotels[6]._id,
                roomName: 'Regency Ocean View',
                roomPrice: 280,
                maxOccupancy: 2,
                quantity: 35,
                description: 'Phòng 50m² với ban công view biển, thiết kế hiện đại, tiện nghi 5 sao.',
                photo: generatePhotos(1, 'room,oceanview')[0],
                status: 'available',
            },
            {
                hotelId: hotels[6]._id,
                roomName: 'Penthouse Suite',
                roomPrice: 800,
                maxOccupancy: 4,
                quantity: 6,
                description: 'Penthouse 120m² tầng cao, view biển panorama, phòng khách và bếp riêng.',
                photo: generatePhotos(1, 'penthouse,room')[0],
                status: 'available',
            },

            // Anantara Hoi An Resort
            {
                hotelId: hotels[7]._id,
                roomName: 'Premier Room',
                roomPrice: 220,
                maxOccupancy: 2,
                quantity: 25,
                description: 'Phòng 40m² với ban công nhìn ra sông hoặc vườn, trang trí phong cách Việt Nam.',
                photo: generatePhotos(1, 'room,vietnam')[0],
                status: 'available',
            },
            {
                hotelId: hotels[7]._id,
                roomName: 'Riverside Suite',
                roomPrice: 450,
                maxOccupancy: 3,
                quantity: 10,
                description: 'Suite 70m² view sông Thu Bồn, phòng khách riêng, ban công lớn.',
                photo: generatePhotos(1, 'room,suite')[0],
                status: 'available',
            },

            // Almanity Hoi An Wellness Resort
            {
                hotelId: hotels[8]._id,
                roomName: 'Deluxe Wellness Room',
                roomPrice: 150,
                maxOccupancy: 2,
                quantity: 30,
                description: 'Phòng 35m² với không gian thoáng đãng, nệm healthy sleep, tiện nghi wellness.',
                photo: generatePhotos(1, 'room,wellness')[0],
                status: 'available',
            },

            // Vinpearl Resort & Spa Nha Trang Bay
            {
                hotelId: hotels[9]._id,
                roomName: 'Deluxe Sea View',
                roomPrice: 300,
                maxOccupancy: 3,
                quantity: 40,
                description: 'Phòng 42m² view biển đẹp, ban công riêng, thiết kế hiện đại.',
                photo: generatePhotos(1, 'room,seaview')[0],
                status: 'available',
            },
            {
                hotelId: hotels[9]._id,
                roomName: 'Vinpearl Villa',
                roomPrice: 800,
                maxOccupancy: 6,
                quantity: 15,
                description: 'Villa 150m² với hồ bơi riêng, sân vườn, view biển tuyệt đẹp.',
                photo: generatePhotos(1, 'villa,seaview')[0],
                status: 'available',
            },

            // Sunrise Nha Trang Beach Hotel & Spa
            {
                hotelId: hotels[10]._id,
                roomName: 'Superior Sea View',
                roomPrice: 120,
                maxOccupancy: 2,
                quantity: 50,
                description: 'Phòng 30m² view biển đẹp, giá hợp lý, tiện nghi đầy đủ.',
                photo: generatePhotos(1, 'room,bedroom')[0],
                status: 'available',
            },
            {
                hotelId: hotels[10]._id,
                roomName: 'Family Suite',
                roomPrice: 250,
                maxOccupancy: 4,
                quantity: 20,
                description: 'Suite 60m² với 2 phòng ngủ, phù hợp cho gia đình, view biển đẹp.',
                photo: generatePhotos(1, 'room,family')[0],
                status: 'available',
            },

            // JW Marriott Phu Quoc Emerald Bay
            {
                hotelId: hotels[11]._id,
                roomName: 'Premier Room Forest View',
                roomPrice: 350,
                maxOccupancy: 2,
                quantity: 30,
                description: 'Phòng 45m² với thiết kế độc đáo mô phỏng phòng học cổ, view rừng xanh.',
                photo: generatePhotos(1, 'room,forest')[0],
                status: 'available',
            },
            {
                hotelId: hotels[11]._id,
                roomName: 'Ocean View Villa',
                roomPrice: 1000,
                maxOccupancy: 4,
                quantity: 12,
                description: 'Villa 180m² với hồ bơi riêng, view biển tuyệt đẹp, dịch vụ butler.',
                photo: generatePhotos(1, 'villa,ocean')[0],
                status: 'available',
            },

            // Salinda Resort Phu Quoc
            {
                hotelId: hotels[12]._id,
                roomName: 'Deluxe Pool Access',
                roomPrice: 250,
                maxOccupancy: 2,
                quantity: 25,
                description: 'Phòng 40m² có cửa trực tiếp ra hồ bơi, thiết kế hiện đại, view vườn.',
                photo: generatePhotos(1, 'room,pool')[0],
                status: 'available',
            },
            {
                hotelId: hotels[12]._id,
                roomName: 'Beachfront Villa',
                roomPrice: 700,
                maxOccupancy: 4,
                quantity: 8,
                description: 'Villa 120m² mặt biển với hồ bơi riêng, sân vườn rộng rãi.',
                photo: generatePhotos(1, 'villa,beach')[0],
                status: 'available',
            },

            // Ana Mandara Villas Dalat
            {
                hotelId: hotels[13]._id,
                roomName: 'Garden Villa',
                roomPrice: 400,
                maxOccupancy: 3,
                quantity: 10,
                description: 'Villa Pháp cổ riêng biệt, nằm giữa vườn hoa và rừng thông, có lò sưởi.',
                photo: generatePhotos(1, 'villa,garden')[0],
                status: 'available',
            },
            {
                hotelId: hotels[13]._id,
                roomName: 'Premium Villa',
                roomPrice: 550,
                maxOccupancy: 4,
                quantity: 7,
                description: 'Villa rộng hơn với 2 phòng ngủ, phòng khách riêng, bếp đầy đủ.',
                photo: generatePhotos(1, 'villa,interior')[0],
                status: 'available',
            },

            // Azerai La Residence Hue
            {
                hotelId: hotels[14]._id,
                roomName: 'Deluxe River View',
                roomPrice: 220,
                maxOccupancy: 2,
                quantity: 30,
                description: 'Phòng 40m² với ban công nhìn ra sông Hương, thiết kế Art Deco sang trọng.',
                photo: generatePhotos(1, 'room,river')[0],
                status: 'available',
            },
            {
                hotelId: hotels[14]._id,
                roomName: 'Royal Suite',
                roomPrice: 550,
                maxOccupancy: 3,
                quantity: 6,
                description: 'Suite 90m² với phòng khách rộng, view sông tuyệt đẹp, nội thất cao cấp.',
                photo: generatePhotos(1, 'room,suite')[0],
                status: 'available',
            },

            // Vinpearl Resort & Spa Ha Long
            {
                hotelId: hotels[15]._id,
                roomName: 'Deluxe Room',
                roomPrice: 280,
                maxOccupancy: 2,
                quantity: 35,
                description: 'Phòng 40m² với view vịnh Hạ Long, ban công riêng, thiết kế hiện đại.',
                photo: generatePhotos(1, 'room,bedroom')[0],
                status: 'available',
            },
            {
                hotelId: hotels[15]._id,
                roomName: 'Executive Suite Bay View',
                roomPrice: 600,
                maxOccupancy: 3,
                quantity: 15,
                description: 'Suite 80m² với view vịnh panorama, phòng khách riêng, dịch vụ butler.',
                photo: generatePhotos(1, 'room,suite')[0],
                status: 'available',
            },

            // Imperial Hotel Vung Tau
            {
                hotelId: hotels[16]._id,
                roomName: 'Superior Ocean View',
                roomPrice: 150,
                maxOccupancy: 2,
                quantity: 40,
                description: 'Phòng 35m² view biển đẹp, ban công riêng, gần bãi biển.',
                photo: generatePhotos(1, 'room,seaview')[0],
                status: 'available',
            },
            {
                hotelId: hotels[16]._id,
                roomName: 'Imperial Suite',
                roomPrice: 380,
                maxOccupancy: 3,
                quantity: 10,
                description: 'Suite 75m² với phòng khách rộng, view biển tuyệt đẹp, nội thất sang trọng.',
                photo: generatePhotos(1, 'room,luxury')[0],
                status: 'available',
            },
        ]);
        console.log(`✅ Created ${roomCategories.length} room categories`);

        // Create Extra Fees
        console.log('💰 Creating extra fees...');
        const extraFees = await ExtraFee.insertMany([
            // Sofitel Metropole Hanoi
            { hotelId: hotels[0]._id, extraName: 'Airport Transfer (Noi Bai)', extraPrice: '40' },
            { hotelId: hotels[0]._id, extraName: 'Le Spa de Metropole - 60 min', extraPrice: '120' },
            { hotelId: hotels[0]._id, extraName: 'Private City Tour', extraPrice: '80' },
            
            // JW Marriott Hanoi
            { hotelId: hotels[1]._id, extraName: 'Airport Limousine Service', extraPrice: '50' },
            { hotelId: hotels[1]._id, extraName: 'Executive Lounge Access', extraPrice: '35' },
            
            // La Siesta Hang Be
            { hotelId: hotels[2]._id, extraName: 'Airport Pickup', extraPrice: '25' },
            { hotelId: hotels[2]._id, extraName: 'Old Quarter Walking Tour', extraPrice: '30' },
            
            // Park Hyatt Saigon
            { hotelId: hotels[3]._id, extraName: 'Airport Transfer (Tan Son Nhat)', extraPrice: '35' },
            { hotelId: hotels[3]._id, extraName: 'Xuan Spa Treatment', extraPrice: '100' },
            { hotelId: hotels[3]._id, extraName: 'Private Cu Chi Tunnels Tour', extraPrice: '120' },
            
            // Caravelle Saigon
            { hotelId: hotels[4]._id, extraName: 'Airport Shuttle', extraPrice: '30' },
            { hotelId: hotels[4]._id, extraName: 'Saigon River Dinner Cruise', extraPrice: '85' },
            
            // InterContinental Danang
            { hotelId: hotels[5]._id, extraName: 'Airport Transfer', extraPrice: '45' },
            { hotelId: hotels[5]._id, extraName: 'Holistic Spa Experience', extraPrice: '150' },
            { hotelId: hotels[5]._id, extraName: 'Private Beach Cabana', extraPrice: '80' },
            
            // Hyatt Regency Danang
            { hotelId: hotels[6]._id, extraName: 'Marble Mountains Tour', extraPrice: '40' },
            { hotelId: hotels[6]._id, extraName: 'Spa Package', extraPrice: '90' },
            
            // Anantara Hoi An
            { hotelId: hotels[7]._id, extraName: 'Sunset River Cruise', extraPrice: '45' },
            { hotelId: hotels[7]._id, extraName: 'Cooking Class', extraPrice: '60' },
            { hotelId: hotels[7]._id, extraName: 'Old Town Cycling Tour', extraPrice: '35' },
            
            // Almanity Hoi An
            { hotelId: hotels[8]._id, extraName: 'Morning Yoga Session', extraPrice: '20' },
            { hotelId: hotels[8]._id, extraName: 'Wellness Spa Package', extraPrice: '75' },
            
            // Vinpearl Nha Trang
            { hotelId: hotels[9]._id, extraName: 'VinWonders Tickets', extraPrice: '35' },
            { hotelId: hotels[9]._id, extraName: 'Snorkeling & Island Tour', extraPrice: '65' },
            { hotelId: hotels[9]._id, extraName: 'Cable Car Round Trip', extraPrice: '25' },
            
            // Sunrise Nha Trang
            { hotelId: hotels[10]._id, extraName: 'Scuba Diving Experience', extraPrice: '85' },
            { hotelId: hotels[10]._id, extraName: 'Mud Bath Package', extraPrice: '30' },
            
            // JW Marriott Phu Quoc
            { hotelId: hotels[11]._id, extraName: 'Airport Transfer', extraPrice: '50' },
            { hotelId: hotels[11]._id, extraName: 'Spa by JW', extraPrice: '120' },
            { hotelId: hotels[11]._id, extraName: 'Private Beach Dinner', extraPrice: '200' },
            { hotelId: hotels[11]._id, extraName: 'Sunset Cruise', extraPrice: '90' },
            
            // Salinda Phu Quoc
            { hotelId: hotels[12]._id, extraName: 'Snorkeling Tour', extraPrice: '55' },
            { hotelId: hotels[12]._id, extraName: 'Motorbike Rental (per day)', extraPrice: '15' },
            
            // Ana Mandara Dalat
            { hotelId: hotels[13]._id, extraName: 'In-Villa Dining', extraPrice: '60' },
            { hotelId: hotels[13]._id, extraName: 'Dalat City Tour', extraPrice: '50' },
            { hotelId: hotels[13]._id, extraName: 'Canyoning Adventure', extraPrice: '75' },
            
            // Azerai Hue
            { hotelId: hotels[14]._id, extraName: 'Imperial City Private Tour', extraPrice: '70' },
            { hotelId: hotels[14]._id, extraName: 'Perfume River Cruise', extraPrice: '45' },
            
            // Vinpearl Ha Long
            { hotelId: hotels[15]._id, extraName: 'Ha Long Bay Cruise', extraPrice: '95' },
            { hotelId: hotels[15]._id, extraName: 'Kayaking Tour', extraPrice: '40' },
            
            // Imperial Vung Tau
            { hotelId: hotels[16]._id, extraName: 'Casino Entry Package', extraPrice: '50' },
            { hotelId: hotels[16]._id, extraName: 'Golf Package (18 holes)', extraPrice: '120' },
        ]);
        console.log(`✅ Created ${extraFees.length} extra fees`);

        // Create some bookings
        console.log('📅 Creating bookings...');
        const bookings = await Booking.insertMany([
            {
                userId: users[1]._id,
                hotelId: hotels[0]._id,
                roomIds: [roomCategories[0]._id],
                name: users[1].fullName,
                adult: 2,
                children: 0,
                baby: 0,
                phone: users[1].phone,
                email: users[1].email,
                status: 'confirmed',
                totalAmount: 540,
                extraIds: [extraFees[0]._id, extraFees[1]._id],
                checkIn: new Date('2024-04-15'),
                checkOut: new Date('2024-04-17'),
            },
            {
                userId: users[2]._id,
                hotelId: hotels[5]._id,
                roomIds: [roomCategories[11]._id],
                name: users[2].fullName,
                adult: 2,
                children: 1,
                baby: 0,
                phone: users[2].phone,
                email: users[2].email,
                status: 'confirmed',
                totalAmount: 1195,
                extraIds: [extraFees[12]._id, extraFees[13]._id],
                checkIn: new Date('2024-05-01'),
                checkOut: new Date('2024-05-04'),
            },
            {
                userId: users[1]._id,
                hotelId: hotels[11]._id,
                roomIds: [roomCategories[25]._id],
                name: users[1].fullName,
                adult: 2,
                children: 0,
                baby: 0,
                phone: users[1].phone,
                email: users[1].email,
                status: 'pending',
                totalAmount: 2390,
                extraIds: [extraFees[26]._id, extraFees[28]._id],
                checkIn: new Date('2024-06-10'),
                checkOut: new Date('2024-06-17'),
            },
        ]);
        console.log(`✅ Created ${bookings.length} bookings`);

        // Create reviews
        console.log('⭐ Creating reviews...');
        const reviews = await Review.insertMany([
            {
                userId: users[1]._id,
                hotelId: hotels[0]._id,
                rating: 5,
                comment: 'Khách sạn tuyệt vời! Dịch vụ chu đáo, phòng ốc sạch sẽ, vị trí đẹp. Sẽ quay lại lần nữa.',
            },
            {
                userId: users[2]._id,
                hotelId: hotels[5]._id,
                rating: 5,
                comment: 'Resort đẹp không thể tả. View biển tuyệt vời, spa rất chuyên nghiệp. Đáng đồng tiền!',
            },
            {
                userId: users[1]._id,
                hotelId: hotels[3]._id,
                rating: 5,
                comment: 'Vị trí trung tâm, phòng rộng rãi, ăn sáng ngon. Service excellence!',
            },
            {
                userId: users[2]._id,
                hotelId: hotels[7]._id,
                rating: 4,
                comment: 'Resort đẹp, gần phố cổ Hội An. Nhân viên thân thiện. Giá hơi cao nhưng xứng đáng.',
            },
            {
                userId: users[1]._id,
                hotelId: hotels[9]._id,
                rating: 5,
                comment: 'Vinpearl Nha Trang không bao giờ làm thất vọng. Trẻ em rất thích công viên nước!',
            },
            {
                userId: users[2]._id,
                hotelId: hotels[11]._id,
                rating: 5,
                comment: 'JW Marriott Phú Quốc là resort đẹp nhất tôi từng đến. Mọi thứ đều hoàn hảo!',
            },
            {
                userId: users[1]._id,
                hotelId: hotels[13]._id,
                rating: 5,
                comment: 'Villa cổ điển tuyệt đẹp, không gian yên tĩnh. Đà Lạt lãng mạn hơn với Ana Mandara.',
            },
            {
                userId: users[2]._id,
                hotelId: hotels[0]._id,
                rating: 5,
                comment: 'Sofitel Metropole là biểu tượng của Hà Nội. Đẳng cấp quốc tế!',
            },
        ]);
        console.log(`✅ Created ${reviews.length} reviews`);

        // Create payments for confirmed bookings
        console.log('💳 Creating payments...');
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
        ]);
        console.log(`✅ Created ${payments.length} payments`);

        console.log('\n🎉 Database seeded successfully!');
        console.log('📊 Summary:');
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Hotels: ${hotels.length}`);
        console.log(`   - Room Categories: ${roomCategories.length}`);
        console.log(`   - Extra Fees: ${extraFees.length}`);
        console.log(`   - Bookings: ${bookings.length}`);
        console.log(`   - Reviews: ${reviews.length}`);
        console.log(`   - Payments: ${payments.length}`);

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedData();