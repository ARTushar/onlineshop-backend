const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    id: {
      type: String
    },
    banglaName: String,
    deliveryCost: {
      type: Number
    }
}, {
    timestamps: true
});

const Locations = mongoose.model('Location', locationSchema);

module.exports = Locations;