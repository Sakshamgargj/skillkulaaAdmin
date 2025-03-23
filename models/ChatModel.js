const mongoose = require('mongoose');

const ChatSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        required: true
    },
    is_admin_read: {
        type: Boolean,
        default: false
    },
    is_user_read: {
        type: Boolean,
        default: false
    }

},
    {
        timestamps: true
    }
);

const chat = mongoose.model('chat', ChatSchema);

module.exports = chat;