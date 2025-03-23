const mongoose = require('mongoose');

const EnrollSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    },
    instructorId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'instructor'
    }],
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course'
    },
    date: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    paymentMode: {
        type: String,
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    payment: {
        type: String,
        required: true
    },
    is_enroll: {
        type: Number,
        default: 0
    },
    is_completed: {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true
    }
);

const enroll = mongoose.model('enroll', EnrollSchema);

module.exports = enroll;