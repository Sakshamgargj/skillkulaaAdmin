const UserModel = require('../models/UserModel')
const CourseModel = require('../models/CourseModel')
const CertificateModel = require('../models/CertificateModel')
const CompletedPercentageModel = require('../models/CompletedPercentageModel')
const EnrollModel = require('../models/EnrollModel')

const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const uploads = path.join('./uploads')
const fs = require('fs')
const AssignmentPercentageModel = require('../models/AssignmentPercentageModel')

// const certificate = async (req, res) => {
//     try {
//         const users = await UserModel.find();
//         const courses = await CourseModel.find();

//         const completedPercentageData = await CompletedPercentageModel.find();

//         const certificateExists = CertificateModel.find(req.query.userId, req.query.courseId);

//         return res.render('certificate', { users, courses, certificateExists, completedPercentageData });

//     } catch (error) {
//         console.log(error);
//     }
// };


const generateCertificate = async (req, res) => {
    try {
        const { userId, courseId } = req.query;

        const assignmentPercentage = await AssignmentPercentageModel.findOne({
            userId: userId,
            courseId: courseId,
        });

        if (!assignmentPercentage || assignmentPercentage.completedPercentage !== 100) {
            return res.status(400).send('Assignment not completed.');
        }

        const existingCertificate = await CertificateModel.findOne({
            userId: userId,
            courseId: courseId,
        });

        if (existingCertificate) {
            return res.status(400).send('Certificate already generated.');
        }

        createCertificate(userId, courseId);

        return res.redirect('back');
    } catch (error) {
        console.error('Error generating certificate:', error);
        return res.status(500).send('Internal Server Error');
    }
};

// backup
// const generateCertificate = async (req, res) => {
//     try {
//         const { userId, assignmentId } = req.query;

//         const assignmentPercentage = await AssignmentPercentageModel.findOne({
//             userId: userId,
//             assignmentId: assignmentId,
//         });

//         if (!assignmentPercentage || assignmentPercentage.completedPercentage !== 100) {
//             return res.status(400).send('Assignment not completed.');
//         }

//         const existingCertificate = await CertificateModel.findOne({
//             userId: userId,
//             assignmentId: assignmentId,
//         });

//         if (existingCertificate) {
//             return res.status(400).send('Certificate already generated.');
//         }

//         createCertificate(userId, assignmentId);

//         return res.redirect('back');
//     } catch (error) {
//         console.error('Error generating certificate:', error);
//         return res.status(500).send('Internal Server Error');
//     }
// };

// const createCertificate = async (userId, courseId) => {
//     try {
//         const enrollment = await EnrollModel.findOne({ userId: userId }).populate('userId');

//         if (!enrollment) {
//             throw new Error('Enrollment not found');
//         }

//         const { firstname, lastname } = enrollment.userId;
//         const certificateTitle = `${firstname} ${lastname}`;

//         const timestamp = new Date().getTime();
//         const imagePath = path.join(uploads, `certificate_${timestamp}_.jpg`);

//         const canvas = createCanvas(1000, 700);
//         const ctx = canvas.getContext('2d');

//         const backgroundImage = await loadImage(uploads + '/123123123.jpg');

//         ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

//         ctx.font = '60px Ephesis';
//         ctx.fillStyle = 'black';
//         ctx.textAlign = 'center';

//         const textX = canvas.width / 2;
//         ctx.fillText(certificateTitle, textX, 370);

//         const buffer = canvas.toBuffer('image/jpeg');
//         fs.writeFileSync(imagePath, buffer);

//         console.log(`Certificate generated and saved at: ${imagePath}`);

//         const certificate = {
//             certificateTitle,
//             imagePath,
//             userId,
//             courseId,
//         };

//         await CertificateModel.create(certificate);

//         return {
//             certificateTitle,
//             imagePath,
//             userId,
//             courseId,
//         };
//     } catch (error) {
//         console.error('Error generating certificate:', error);
//         throw error;
//     }
// }

registerFont(path.join(__dirname, '../public/assets/vendor/fonts/Lora', 'Lora-Regular.ttf'), { family: 'Lora' });

const createCertificate = async (userId, courseId) => {
    try {
        // Fetch enrollment details
        const enrollment = await EnrollModel.findOne({ userId: userId }).populate('userId');
        if (!enrollment) {
            throw new Error('Enrollment not found');
        }

        // Fetch course details
        const course = await CourseModel.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }

        const { firstname, lastname } = enrollment.userId;
        const certificateTitle = `${firstname} ${lastname}`;
        const courseTitle = course.course;

        // Additional text to prepend before course name
        const additionalText = "Has Successfully Completed the";
        const combinedText = `${additionalText} ${courseTitle} Course.`;

        const timestamp = new Date().getTime();
        const imagePath = path.join(uploads, `certificate_${timestamp}_.jpg`);

        const canvas = createCanvas(1000, 700);
        const ctx = canvas.getContext('2d');

        const backgroundImage = await loadImage(uploads + '/123123123.jpg');

        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        // Add user name
        ctx.font = '48px Lora';
        ctx.fillStyle = '#0B1320';
        ctx.textAlign = 'center';
        const textX = canvas.width / 2;
        ctx.fillText(certificateTitle, textX, 370);

        // Add additional text before course name
        ctx.font = '20px Lora';  // Adjust font and size as needed
        ctx.fillText(combinedText, textX, 425);  // Adjust position as needed

        // Add course name
        //ctx.fillText(courseTitle, textX, 500);  // Adjust position as needed

        const buffer = canvas.toBuffer('image/jpeg');
        fs.writeFileSync(imagePath, buffer);

        console.log(`Certificate generated and saved at: ${imagePath}`);

        const certificate = {
            certificateTitle,
            courseTitle, // Add course title to the certificate data
            imagePath,
            userId,
            courseId,
        };

        await CertificateModel.create(certificate);

        return {
            certificateTitle,
            courseTitle, // Return course title as part of the response
            imagePath,
            userId,
            courseId,
        };
    } catch (error) {
        console.error('Error generating certificate:', error);
        throw error;
    }
}


//backup
// const createCertificate = async (userId, assignmentId) => {
//     try {
//         const enrollment = await EnrollModel.findOne({ userId: userId }).populate('userId');

//         if (!enrollment) {
//             throw new Error('Enrollment not found');
//         }

//         const { firstname, lastname } = enrollment.userId;
//         const certificateTitle = `${firstname} ${lastname}`;

//         const timestamp = new Date().getTime();
//         const imagePath = path.join(uploads, `certificate_${timestamp}_.jpg`);

//         const canvas = createCanvas(1000, 700);
//         const ctx = canvas.getContext('2d');

//         const backgroundImage = await loadImage(uploads + '/123123123.jpg');

//         ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

//         ctx.font = '60px Ephesis';
//         ctx.fillStyle = 'black';
//         ctx.textAlign = 'center';

//         const textX = canvas.width / 2;
//         ctx.fillText(certificateTitle, textX, 370);

//         const buffer = canvas.toBuffer('image/jpeg');
//         fs.writeFileSync(imagePath, buffer);

//         console.log(`Certificate generated and saved at: ${imagePath}`);

//         const certificate = {
//             certificateTitle,
//             imagePath,
//             userId,
//             assignmentId,
//         };

//         await CertificateModel.create(certificate);

//         return {
//             certificateTitle,
//             imagePath,
//             userId,
//             assignmentId,
//         };
//     } catch (error) {
//         console.error('Error generating certificate:', error);
//         throw error;
//     }
// }

// const addCertificate = async (req, res) => {
//     try {
//         const { certificateTitle } = req.body;

//         const canvas = createCanvas(1000, 700);
//         const ctx = canvas.getContext('2d');

//         const backgroundImage = await loadImage(uploads + '/123123123.jpg');
//         ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

//         ctx.font = '60px Ephesis';
//         ctx.fillStyle = 'black';
//         ctx.textAlign = 'center';

//         const textX = canvas.width / 2;

//         ctx.fillText(certificateTitle, textX, 370);

//         const timestamp = new Date().getTime();
//         const outputCertificatePath = path.join(uploads, `certificate_${timestamp}_.jpg`);

//         const buffer = canvas.toBuffer('image/jpeg');
//         fs.writeFileSync(outputCertificatePath, buffer);

//         await CertificateModel.create({ certificateTitle: certificateTitle, imagePath: outputCertificatePath, userId: req.query.userId, courseId: req.query.courseId });

//         return res.redirect('/education/viewenroll');
//     } catch (error) {
//         console.error('Error adding certificate:', error);
//         return res.status(500).json({ success: 0, message: 'An error occurred while adding the certificate.' });
//     }
// };

// const addCertificate = async (req, res) => {
//     try {
//         // Fetch enrollment data to get the certificate title
//         const enrollment = await EnrollModel.findOne({ userId: req.query.userId, courseId: req.query.courseId });

//         if (!enrollment) {
//             return res.status(400).json({ success: 0, message: 'Enrollment not found.' });
//         }

//         const certificateTitle = enrollment.certificateTitle;

//         // Check if assignment percentage is 100%
//         const assignmentPercentage = await AssignmentPercentageModel.findOne({
//             userId: req.query.userId,
//             assignmentId: req.query.assignmentId // Adjust this based on your data structure
//         });

//         if (!assignmentPercentage || assignmentPercentage.completedPercentage !== 100) {
//             // Assignment percentage is not 100%, handle accordingly
//             return res.status(400).json({ success: 0, message: 'Assignment percentage is not 100%. Certificate not generated.' });
//         }

//         // Assignment percentage is 100%, generate certificate
//         const canvas = createCanvas(1000, 700);
//         const ctx = canvas.getContext('2d');

//         const backgroundImage = await loadImage(uploads + '/123123123.jpg');
//         ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

//         ctx.font = '60px Ephesis';
//         ctx.fillStyle = 'black';
//         ctx.textAlign = 'center';

//         const textX = canvas.width / 2;

//         ctx.fillText(certificateTitle, textX, 370);

//         const timestamp = new Date().getTime();
//         const outputCertificatePath = path.join(uploads, `certificate_${timestamp}_.jpg`);

//         const buffer = canvas.toBuffer('image/jpeg');
//         fs.writeFileSync(outputCertificatePath, buffer);

//         await CertificateModel.create({ certificateTitle, imagePath: outputCertificatePath, userId: req.query.userId, courseId: req.query.courseId });

//         return res.redirect('/education/viewenroll');
//     } catch (error) {
//         console.error('Error adding certificate:', error);
//         return res.status(500).json({ success: 0, message: 'An error occurred while adding the certificate.' });
//     }

// };

module.exports = {
    // certificate
    generateCertificate
    // addCertificate
}