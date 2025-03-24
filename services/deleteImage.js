// Importing required modules 
const fs = require("fs");

// Defining the path where uploaded images are stored
const imagePath = './uploads/'

// Function to delete an uploaded file
function deleteImages(filename) {

    try {

        if (fs.existsSync(imagePath + filename)) {

            fs.unlinkSync(imagePath + filename);

        }

    } catch (err) {
        console.error(`Error deleting file: ${err}`);
    }
}

// Defining the path where uploaded images are stored
const audioPath = './videofile/'

// Function to delete an uploaded file
function deleteAudio(filename) {

    try {

        if (fs.existsSync(audioPath + filename)) {

            fs.unlinkSync(audioPath + filename);

        }

    } catch (err) {
        console.error(`Error deleting file: ${err}`);
    }
}

module.exports = { deleteImages, deleteAudio }