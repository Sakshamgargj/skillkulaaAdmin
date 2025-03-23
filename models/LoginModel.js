const mongoose = require('mongoose');

const LoginSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: Number,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    is_admin: {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true
    });

const login = mongoose.model('login', LoginSchema);
module.exports = login;