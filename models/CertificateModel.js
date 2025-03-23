const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course'
    },
    certificateTitle: {
        type: String,
        //required: true,
    },
    imagePath: {
        type: String,
        //required: true,
    }
},
    {
        timestamps: true
    }
);

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
