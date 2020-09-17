const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const cartSchema = Schema({
    products: {
        type: [productAmountSchema]
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const productAmountSchema = Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
})

const Carts = mongoose.model('Cart', cartSchema);

module.exports = Carts;