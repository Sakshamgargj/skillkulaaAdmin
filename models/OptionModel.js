const mongoose = require('mongoose');

const OptionSchema = mongoose.Schema({
    letter: {
        type: String,
        required: true,
        uppercase: true,
    },
    text: {
        type: String,
        required: true,
    },
    isCorrect: {
        type: Boolean,
        default: false,
    },
});

const option = mongoose.model('option', OptionSchema);

module.exports = option;
