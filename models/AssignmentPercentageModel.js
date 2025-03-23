const mongoose = require('mongoose');

const AssignmentPercentageSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course'
    },
    avg_assignment_percentage: {
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

const AssignmentPercentageModel = mongoose.model('assignmentpercentage', AssignmentPercentageSchema);

module.exports = AssignmentPercentageModel;
