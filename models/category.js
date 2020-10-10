const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    subCategory: {
        type: [String],
    }
}, {
    timestamps: true
});

const Categories = mongoose.model('Category', categorySchema);

module.exports = Categories;