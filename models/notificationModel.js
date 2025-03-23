const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },
    recipient_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    recipient_admin: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    is_read: {
        type: Boolean,
        default: false,
        trim: true
    }

},
    {
        timestamps: true
    }
);

module.exports = mongoose.model("notification", notificationSchema);