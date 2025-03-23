const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({

    firstname: {
        type: String,
        required: true,
        trim: true
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    country_code: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: String,
        trim: true
    },
    isVerified: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    });

const user = mongoose.model('user', UserSchema);
module.exports = user;