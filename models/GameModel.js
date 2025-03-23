const mongoose = require('mongoose');

const GameSchema = mongoose.Schema({

    level: {
        type: String,
        required: true
    },
    words: {
        type: String,
        ref: 'course'
    }
},
    {
        timestamps: true
    }
);

const game = mongoose.model('game', GameSchema);
module.exports = game;