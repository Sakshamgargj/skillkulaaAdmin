const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.DB_CONNECTION);

const db = mongoose.connection;

db.on('err', console.error.bind(console, "DB not connected"));

db.once('open', (err) => {
    if (err) {
        console.log("DB not start");
        return false;
    }
    console.log("DB start");
})

module.exports = db;
