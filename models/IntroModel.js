const mongoose = require('mongoose');

const IntroSchema = mongoose.Schema({

    avatar: {
        type: String,
        required: true
    },
    intro: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
   
},
    {
        timestamps: true
    }
);

const intro = mongoose.model('intro', IntroSchema);
module.exports = intro;