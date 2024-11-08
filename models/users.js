const mongoose = require('mongoose');
const validator = require('validator');
const passportLocalMongoose = require('passport-local-mongoose');

const Schema = mongoose.Schema;
const { titleCase, addCountryCode } = require('../lib/utils');

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        set: titleCase,
        match: /[a-zA-Z ]+/
    },
    salt: {
        type: String,
        required: true,
    },
    hash: {
        type: String,
        requried: true,
    },
    admin: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        index: { unique: true, sparse: true },
        validate: (value) => {
            return !value || validator.isEmail(value);
        }
    },
    mobile: {
        type: String,
        trim: true,
        index: { unique: true, sparse: true },
        minlength: 11,
        maxlength: 14,
        set: addCountryCode,
        validate: (value) => {
            return !value || validator.isMobilePhone(value);
        }
    },
    facebookId: {
        type: String,
        trim: true,
        index: { unique: true, sparse: true }
    },
    googleId: {
        type: String,
        trim: true,
        index: { unique: true, sparse: true }
    },
    address: {
        country: {
            type: String,
            trim: true,
            default: 'Bangladesh'
        },
        district: {
            type: String,
            trim: true,
            default: ''
        },
        thana: {
            type: String,
            trim: true,
            default: ''
        },
        region: {
            type: String,
            trim: true,
            default: ''
        },
        postalCode: {
            type: Number,
        },
        homeLocation: {
            type: String,
            trim: true,
            default: ''
        }
    },
    wishList:[{
            type: Schema.Types.ObjectId,
            ref: 'Product',
        }]
}, {
    timestamps: true
})


userSchema.plugin(passportLocalMongoose, {
    usernameField: 'mobile',
    usernameQueryFields: ['email']
});

const Users = mongoose.model('User', userSchema);

module.exports = Users;