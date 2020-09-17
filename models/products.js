const mongoose = require('mongoose');
const Schema = mongoose.Schema;

require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;

const productSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Currency,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    image: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        default: Infinity
    },
    averageRating: {
        type: Number,
        min: 1,
        max: 5
    },
    sku: {
        type: String,
    },
    categories: {
        type: [String],
        validate: (v) => {
            return Array.isArray(v) && v.length > 0;
        }
    },
    features:  {
        type: [featureSchema]
    },
    specifications: {
        type: [String]
    },
    featuredImages: {
        type: [String]
    },
    reviews: {
        type: [reviewSchema]
    }
}, {
    timestamps: true
})

const featureSchema = Schema({
    heading: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    }
});

const reviewSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    rating: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5]
    },
    heading: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
    },
    description: {
        type: String
    },
}, {
    timestamps: true
});

const Products = mongoose.model('Product', productSchema);

module.exports = Products;