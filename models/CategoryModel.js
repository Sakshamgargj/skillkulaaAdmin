const mongoose = require('mongoose');

const CategorySchema = mongoose.Schema({

    avatar: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Publish", "UnPublish"],
        default: "Publish",
        trim: true
    }
},
    {
        timestamps: true
    }
);

const category = mongoose.model('category', CategorySchema);

module.exports = category;