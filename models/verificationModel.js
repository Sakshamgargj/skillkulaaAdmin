const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({

    key: {
        type: String,
        required: true,
    },
    base_url: {
        type: String,
        required: true,
    }

},
    { timestamps: true }
);

module.exports = mongoose.model('verification', verificationSchema);