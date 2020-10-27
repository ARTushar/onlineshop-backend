const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    subCategory: {
        type: [{
            type: String,
            trim: true,
            lowercase: true
        }],
    }
}, {
    timestamps: true
});

const Categories = mongoose.model('Category', categorySchema);

module.exports = Categories;