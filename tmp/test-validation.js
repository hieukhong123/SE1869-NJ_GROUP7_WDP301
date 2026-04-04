import mongoose from 'mongoose';
import Hotel from '../api/src/models/Hotel.js';

async function testValidation() {
    const invalidHotelData = {
        name: 'Test Hotel',
        address: '123 Test St',
        city: 'Test City',
        hotelPhone: '123456789', // 9 digits - Should fail
        hotelEmail: 'test@example.com'
    };

    const hotel = new Hotel(invalidHotelData);
    
    try {
        await hotel.validate();
        console.log('Validation passed unexpectedly!');
    } catch (error) {
        console.log('Validation failed as expected:');
        console.log(error.errors.hotelPhone.message);
    }

    const validHotelData = {
        ...invalidHotelData,
        hotelPhone: '0123456789' // 10 digits - Should pass
    };
    
    const validHotel = new Hotel(validHotelData);
    try {
        await validHotel.validate();
        console.log('Validation passed as expected for 10 digits.');
    } catch (error) {
        console.log('Validation failed unexpectedly for 10 digits:');
        console.log(error.message);
    }
    
    process.exit(0);
}

testValidation();
