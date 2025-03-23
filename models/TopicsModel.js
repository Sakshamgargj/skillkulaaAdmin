const mongoose = require('mongoose');

const TopicSchema = mongoose.Schema({

    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lesson'
    },
    topic: {
        type: String,
        trim: true,
        required: true
    },
    allfile: {
        type: String,
        trim: true
    },
    upload_type: {
        type: String,
        enum: ['Video', 'URL', 'YouTube'],
        trim: true
    },
    link: { // youtube code
        type: String,
        trim: true
    },
    video: { // video file
        type: String,
        trim: true
    },
    url: { // video url
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    }

},
    {
        timestamps: true
    }
);

const topic = mongoose.model('topic', TopicSchema);

module.exports = topic;