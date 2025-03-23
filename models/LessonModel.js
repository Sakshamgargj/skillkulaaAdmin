const mongoose = require('mongoose');

const lessonSchema = mongoose.Schema({

    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course'
    },
    lesson: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
    }
);

const lesson = mongoose.model('lesson', lessonSchema);
module.exports = lesson;