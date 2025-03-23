const mongoose = require('mongoose');

const SliderSchema = mongoose.Schema({

    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course'
    },
    avatar: {
        type: String,
        required: true,
        trim: true
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

const slider = mongoose.model('slider', SliderSchema);

module.exports = slider;