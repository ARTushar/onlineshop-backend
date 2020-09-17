const mongoose = require('mongoose');
const validator = require('validator');
const passportLocalMongoose = require('passport-local-mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        set: titleCase,
        validate: (value) => {
            return /[a-zA-Z ]+/.test(value)
        }
    },
    admin: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        lowercase: true,
        validate: (value) => {
            return validator.isEmail(value);
        }
    },
    mobile: {
        type: String,
        validate: (value) => {
            return validator.isMobilePhone(value);
        }
    },
    image: {
        type: String,
    },
    address: {
        country: {
            type: String,
            default: 'Bangladesh'
        },
        district: {
            type: String, 
            default: ''
        },
        thana: {
            type: String,
            default: ''
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
        }
    }
}, {
    timestamps: true
})

const titleCase = (name) => {
    return name
        .trim()
        .toLowerCase()
        .split(/[ \t]+/)
        .map(word => word.charAt[0].toUpperCase() + word.slice(1))
        .join(' ');
};

userSchema.plugin(passportLocalMongoose, {
    usernameField: 'mobile'
});

const Users = mongoose.model('User', userSchema);

module.exports = Users;