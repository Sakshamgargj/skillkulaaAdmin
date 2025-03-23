const mongoose = require('mongoose');
const assignment = require('./AssignmentModel');

const AttemptSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course'
    },
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'assignment'
    },
    quiz: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'question',
        },
        seletedOption: {
            type: String,
            required: true
        },
        is_correct: {
            type: Number,
            default: 0
        },
    }],
    total_assignment_question: {
        type: Number,
        default: 0,
        trim: true
    },
    total_attempt_question: {
        type: Number,
        default: 0,
        trim: true
    },
    total_correct_answer: {
        type: Number,
        default: 0,
        trim: true
    },
    total_wrong_answer: {
        type: Number,
        default: 0,
        trim: true
    },
    score_percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        trim: true
    }
},
    {
        timestamps: true
    }
);

const attempt = mongoose.model('attempt', AttemptSchema);

module.exports = attempt;
