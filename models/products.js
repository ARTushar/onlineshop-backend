const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
mongoose.plugin(slug);
const Schema = mongoose.Schema;

require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;

const reviewSchema = Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5]
    },
    description: {
        type: String,
        trim: true
    },
}, {
    timestamps: true
});

const questionAnswerSchema = Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    question: {
        type: String,
        minlength: 1,
        maxlength: 100,
        required: true,
        trim: true
    },
    answer: {
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
    slug: {
        type: String,
        slug: "title"
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
        type: [String]
    },
    specifications: {
        type: [String]
    },
    featuredImages: {
        type: [String]
    },
    reviews: {
        type: [reviewSchema]
    },
    questionAnswers: {
        type: [questionAnswerSchema]
    }
}, {
    timestamps: true
})



const Products = mongoose.model('Product', productSchema);

module.exports = Products;