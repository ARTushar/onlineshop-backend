const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;


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
            required: true
        },
        transactionId: {
            type: String,
            default: ''
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
        type: String
    },
    parcelId: {
        type: String
    }
}, {
    timestamps: true
})

const shippingSchema = new Schema({
    customer: {
        type: String,
        required: true
    },
    country: {
        type: String,
        default: 'Bangladesh',
        
    },
    district: {
        type: String,
        default: '',
    },
    thana: {
        type: String,
        default: '',
    },
    region: {
        type: String,
        default: ''
    },
    postalCode: {
        type: Number,
    },
    homeLocation: {
        type: String,
        default: ''
    },
    deliveryNotes: {
        type: String
    },
    mobile: {
        type: String,
        validate: value => validator.isMobilePhone(value)
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

const Orders = mongoose.model('Order', orderSchema);

module.exports = Orders;