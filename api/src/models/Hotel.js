const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
    {
        locationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        hotelPhone: {
            type: Number,
            required: true,
        },
        hotelEmail: {
            type: String,
            required: true,
        },
        expiryDate: {
            type: Date,
        },
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Hotel', hotelSchema);
