const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
    {
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment',
            required: true,
        },
        bankNumber: {
            type: String,
            required: true,
        },
        bankName: {
            type: String,
            required: true,
        },
        reasons: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Refund', refundSchema);
