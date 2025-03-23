const mongoose = require('mongoose');

const CourseSchema = mongoose.Schema({
    
    avatar: {
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    },
    instructorId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'instructor'
    }],
    course: {
        type: String,
        required: true
    },
    videourl: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    about: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    skill: {
        type: String,
        required: true
    },
    is_Certified: {
        type: Boolean,
        default: true
    },
    is_Secure: {
        type: Boolean,
        default: true
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

const course = mongoose.model('course', CourseSchema);

module.exports = course;