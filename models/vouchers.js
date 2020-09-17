const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const voucherSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    validity: {
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        min: 1,
        default: 1
    },
    discountAmount: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    }
}, {
    timestamps: true
});

const Vouchers = mongoose.model('Voucher', voucherSchema);

module.exports = Vouchers;