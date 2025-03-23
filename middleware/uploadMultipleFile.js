// Importing required modules
const multer = require("multer");
const path = require("path");
const fs = require("fs");


// Configuration for Multer and file storage
const videoStorage = multer.diskStorage({

    destination: function (req, file, cb) {

        if (file.fieldname === 'allfile' || file.fieldname === 'video_file') {
            const destinationPath = path.join(__dirname, '../videofile');
            cb(null, destinationPath);
        }
    },
    filename: function (req, file, cb) {
        // Get the current timestamp
        const timestamp = Date.now();
        // Get the current file originalname
        const originalname = file.originalname;
        // Get the file extension
        const extension = originalname.split('.').pop();

        const sanitizedOriginalName = file.originalname.replace(/\s+/g, '-');
        //Get create new name for file
        const newFilename = `${timestamp}_${sanitizedOriginalName}`;
        cb(null, newFilename);
    }
});

const videoUpload = multer({
    storage: videoStorage
});

const uploadMiddleware = (fields) => {
    return (req, res, next) => {
        videoUpload.fields(fields)(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            const files = req.files;
            const errors = [];

            // Loop through the keys of the files object
            Object.keys(files).forEach((fieldname) => {
                files[fieldname].forEach((file) => {

                    // Separate validation logic for 'video' field
                    if (fieldname === 'video_file') {
                        const allowedVideoTypes = ['video/mp4'];

                        if (!allowedVideoTypes.includes(file.mimetype)) {
                            errors.push(`The file "${file.originalname}" is not a valid video type. Please upload an MP4 video file.`);
                        }
                    }
                });
            });

            if (errors.length > 0) {
                // Remove uploaded files
                Object.keys(files).forEach((fieldname) => {
                    files[fieldname].forEach((file) => {
                        const filePath = path.join(__dirname, '../videofile', file.filename); // Construct the full path
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath); // Delete the file
                        }
                    });
                });
                req.flash('error', `${errors.join(', ')}`);
                return res.redirect('back');
            }
            
            req.files = files;
            next();
        });
    };
};

// Use uploadMiddleware with specified fields
const fieldsToUpload = [
    { name: 'allfile', maxCount: 1 },
    { name: 'video_file', maxCount: 1 }
];

const multiplefile = uploadMiddleware(fieldsToUpload);

module.exports = multiplefile;




