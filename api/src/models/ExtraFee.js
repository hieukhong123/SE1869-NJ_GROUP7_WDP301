const mongoose = require('mongoose');

const extraFeeSchema = new mongoose.Schema(
    {
        hotelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hotel',
            required: true,
        },
        extraPrice: {
            type: String,
            required: true,
        },
        extraName: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ExtraFee', extraFeeSchema);
