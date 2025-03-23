const mongoose = require('mongoose');

const completedPercentageSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course',
        required: true,
    },
    completedPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        trim: true
    }
},
    {
        timestamps: true
    }
);

const CompletedPercentageModel = mongoose.model('CompletedPercentage', completedPercentageSchema);

module.exports = CompletedPercentageModel;
