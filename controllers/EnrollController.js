// Importing models
const EnrollModel = require('../models/EnrollModel');
const LoginModel = require('../models/LoginModel');
const CompletedPercentageModel = require('../models/CompletedPercentageModel');
const AssignmentPercentageModel = require('../models/AssignmentPercentageModel');
const CertificateModel = require('../models/CertificateModel');

// Importing the service function to check if the user is verified
const { checkVerify} = require("../services/getConfigstoreInstance");

// get all enrollments
const viewenroll = async (req, res) => {

    try {

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host')
        const verifyData = await checkVerify(currentUrl);

        // Fetch all enrollments with populated course and user data
        const viewEnrollments = await EnrollModel.find({}).populate("userId", "firstname lastname email avatar")
            .populate("courseId", "course price is_Certified ")

        // Fetch login data
        const loginData = await LoginModel.find({});

        // Process each enrollment to gather additional data
        const userAssignmentPercentages = await Promise.all(viewEnrollments.map(async (enrollment) => {

            const userId = enrollment.userId._id;
            const courseId = enrollment.courseId._id;

            // Fetch completed percentage data
            const completedPercentageData = await CompletedPercentageModel.findOne({ userId, courseId });

            // Fetch assignment percentage data
            const assignmentPercentageData = await AssignmentPercentageModel.findOne({ userId, courseId });

            // Fetch certificate data
            const certificates = await CertificateModel.findOne({ userId, courseId });

            const certificates_path = certificates ? certificates.imagePath.replace(/\\/g, '/') : null;

            return {
                ...enrollment.toObject(),
                course_score_percentage: completedPercentageData ? completedPercentageData.completedPercentage : 0,
                assignment_score_percentage: assignmentPercentageData ? assignmentPercentageData.avg_assignment_percentage : 0,
                certificates_path: certificates_path
            };
        }));

        // console.log("userAssignmentPercentages ===>", userAssignmentPercentages);

        // Render the view with the collected data
        return res.render('viewenroll', { myenroll: userAssignmentPercentages, loginData: loginData });

    } catch (error) {
        console.error('Error fetching enrollments:', error);
        return res.redirect('back');
    }
};

// edit
const editbooking = async (req, res) => {

    try {

        let id = req.query.id;

        const editbooking = await EnrollModel.findById({ _id: id });

        return res.render('editenroll', { editbooking: editbooking });

    } catch (error) {
        console.error('Error fetching booking :', error);
    }
}

// upadate
const updatebooking = async (req, res) => {

    try {

        let id = req.body.editid;

        const updatebooking = await EnrollModel.findByIdAndUpdate(id, { payment: req.body.payment });

        return res.redirect('/viewenroll');

    } catch (error) {
        console.error('Error fetching booking :', error);
    }
}

module.exports = {
    viewenroll,
    editbooking,
    updatebooking
}

