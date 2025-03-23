const mongoose = require('mongoose');

const ReviewSchema = mongoose.Schema({

    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    rating: {
        type: Number,
        required: true
    },
    review: {
        type: String,
        required: true
    },
    isPublish: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
    }
);

const review = mongoose.model('review', ReviewSchema);

module.exports = review;