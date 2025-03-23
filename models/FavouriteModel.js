const mongoose = require('mongoose');

const FavouriteSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
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

const favorite = mongoose.model('favorite', FavouriteSchema);

module.exports = favorite;