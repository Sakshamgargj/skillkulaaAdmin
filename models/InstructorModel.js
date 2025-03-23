const mongoose = require('mongoose');

const InstructorSchema = mongoose.Schema({

    avatar: {
        type: String,
        required: true
    },
    instructor: {
        type: String,
        required: true
    },
    degree: {
        type: String,
        required: true
    },
    speciality: {
        type: String,
        required: true
    },
    about: {
        type: String,
        required: true
    }
    
},
    {
        timestamps: true
    }
);

const instructor = mongoose.model('instructor', InstructorSchema);
module.exports = instructor;