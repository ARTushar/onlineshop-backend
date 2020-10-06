const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;
const { titleCase } = require('../lib/utils');

const shippingSchema = new Schema({
    customer: {
        type: String,
        required: true,
        set: titleCase
    },
    country: {
        type: String,
        default: 'Bangladesh',
        trim: true
    },
    district: {
        type: String,
        default: '',
        trim: true
    },
    thana: {
        type: String,
        default: '',
        trim: true
    },
    region: {
        type: String,
        default: '',
        trim: true
    },
    postalCode: {
        type: Number,
    },
    homeLocation: {
        type: String,
        default: '',
        trim: true
    },
    deliveryNotes: {
        type: String,
        trim: true
    },
    mobile: {
        type: String,
        trim: true,
        validate: value => !value || validator.isMobilePhone(value)
    }
});

const productSchema = Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        min: 1,
        required: true
    }
});

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shippingAddress: shippingSchema,
    payment: {
        method: {
            type: String,
            required: true,
            trim: true
        },
        transactionId: {
            type: String,
            default: '',
            trim: true
        }
    },
    products: {
        type: [productSchema],
        validate: (v) => Array.isArray(v) && v.length > 1
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'onDelivery', 'delivered', 'cancelled'],
        default: 'pending'
    },
    totalCost: {
        type: Currency,
        rquired: true,
        min: 0
    },
    voucher: {
        type: Schema.Types.ObjectId,
        ref: 'Voucher'
    },
    deliveryAgent: {
        type: String,
        trim: true
    },
    parcelId: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
})



const Orders = mongoose.model('Order', orderSchema);

module.exports = Orders;