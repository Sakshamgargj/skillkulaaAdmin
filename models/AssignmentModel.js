const mongoose = require('mongoose');

const AssignmentSchema = mongoose.Schema({

    assignment: {
        type: String,
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course'
    }
},
    {
        timestamps: true
    }
);

const assignment = mongoose.model('assignment', AssignmentSchema);
module.exports = assignment;