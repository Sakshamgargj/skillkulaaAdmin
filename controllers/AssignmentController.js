// Importing models
const AssignmentModel = require('../models/AssignmentModel');
const CourseModel = require('../models/CourseModel');
const LoginModel = require('../models/LoginModel');
const QuestionModel = require('../models/QuestionModel');
const AttemptAssignmentModel = require('../models/AttemptAssignmentModel');
const AssignmentPercentageModel = require('../models/AssignmentPercentageModel');
const CertificateModel = require('../models/CertificateModel');

// Importing the service function to check if the user is verified
const { checkVerify, clearConfigData } = require("../services/getConfigstoreInstance");

// view for add assignment
const assignment = async (req, res) => {

    try {

        let catdata = await CourseModel.find({})

        return res.render('assignment', { coursedata: catdata });

    } catch (error) {
        console.error('Error fetching category :', error);
    }
}

// add asignment
const assignmentdata = async (req, res) => {

    try {

        let loginData = await LoginModel.findOne({ _id: req.session.userId });

        if (loginData && loginData.is_admin === 0) {
            req.flash('error', 'You don\'t have permission to add assignment. As a demo admin, you can only view the content.');
            return res.redirect('/assignment');
        }

        const courseId = req.body.courseId;
        const assignment = req.body.assignment;

        // save assignment
        await AssignmentModel.create({ courseId, assignment })

        return res.redirect('/viewassignment');

    } catch (error) {
        console.error('Error fetching category :', error);
    }
}

// view for all assignment
const viewassignment = async (req, res) => {

    try {

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host')
        const verifyData = await checkVerify(currentUrl);

        if (verifyData === 0) { clearConfigData(); }

        const viewassignment = await AssignmentModel.find({}).populate('courseId');

        const loginData = await LoginModel.find({});

        return res.render('viewassignment', { success: true, myassignment: viewassignment, loginData: loginData });

    } catch (error) {
        console.error('Error fetching assignment :', error);
    }
}

// delete assignment
const deleteassignment = async (req, res) => {

    try {

        const id = req.query.id;

        // Fetch the assignment details and populate related data
        const assignment = await AssignmentModel.findById(id).populate("courseId");

        if (!assignment) {
            req.flash('error', 'Assignment not found.');
            return res.redirect('/viewassignment');
        }

        const courseId = assignment.courseId._id;

        // Delete questions related to the assignment
        await QuestionModel.deleteMany({ assignmentId: id });

        // Delete assignment percentage
        await AssignmentPercentageModel.deleteMany({ assignmentId: id });

        // Delete attempt assignment questions
        await AttemptAssignmentModel.deleteMany({ assignmentId: id });

        // Fetch certificates related to the course
        const certificates = await CertificateModel.find({ courseId });

        // Delete certificate images
        certificates.forEach(certificate => {
            if (fs.existsSync(certificate.imagePath)) {
                fs.unlinkSync(certificate.imagePath);
            }
        });

        // Delete certificates
        await CertificateModel.deleteMany({ courseId });

        // Finally, delete the assignment
        await AssignmentModel.findByIdAndDelete(id);

        // Redirect to the assignment view after deletion
        return res.redirect('/viewassignment');

    } catch (error) {
        console.error('Error deleting assignment:', error);
        req.flash('error', 'An error occurred while deleting the assignment.');
        return res.redirect('/viewassignment');
    }
}

// viewfor Edit assignment
const editassignment = async (req, res) => {

    try {

        let id = req.query.id;

        const editassignment = await AssignmentModel.findById({ _id: id }).populate('courseId');

        const coursedata = await CourseModel.find({});

        return res.render('editassignment', { editassignment: editassignment, coursedata: coursedata });

    } catch (error) {
        console.error('Error fetching assignment :', error);
    }
}

// update assignment
const updateassignment = async (req, res) => {

    try {

        let id = req.query.id;

        // update assignment
        await AssignmentModel.findByIdAndUpdate(id, { courseId: req.body.courseId, assignment: req.body.assignment });

        return res.redirect('/viewassignment');

    } catch (error) {
        console.error('Error fetching assignment :', error);
    }
}

module.exports = {
    assignment,
    assignmentdata,
    viewassignment,
    deleteassignment,
    editassignment,
    updateassignment
}