const mongoose = require('mongoose');

const QuestionSchema = mongoose.Schema({

    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'assignment'
    },
    text: {
        type: String,
        required: true,
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function (v) {
                return v.length === 4;
            },
            message: 'There must be exactly four options.',
        },
    },
    correctOption: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return ['A', 'B', 'C', 'D'].includes(v);
            },
            message: 'Correct option must be one of A, B, C, or D.',
        },
    }
}
);

const question = mongoose.model('question', QuestionSchema);

module.exports = question;
