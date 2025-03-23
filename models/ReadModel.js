const mongoose = require('mongoose');

const ReadSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course',
        required: true
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lesson',
        required: true
    },
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'topic',
        required: true
    },
    done: {
        type: Number,
        default: 1,
        trim: true
    }

},
    {
        timestamps: true
    }
);

const read = mongoose.model('read', ReadSchema);

module.exports = read;