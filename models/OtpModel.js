const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({

    email: {
        
        type: String,
        required: true
    },
    otp: {
        type: Number
    }
},
    {
        timestamps: true
    });

const otp = mongoose.model('otp', otpSchema);
module.exports = otp;