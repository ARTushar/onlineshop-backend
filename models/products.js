const mongoose = require('mongoose');
const Schema = mongoose.Schema;

require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;

const featureSchema = Schema({
    heading: {
        type: String,
        default: '',
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
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
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
}, {
    timestamps: true
});

const productSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true
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
        required: true,
        trim: true
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
        trim: true
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



const Products = mongoose.model('Product', productSchema);

module.exports = Products;