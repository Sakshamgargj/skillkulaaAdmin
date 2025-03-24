// Importing required modules 
const fs = require('fs');
const path = require('path');
const uploads = path.join('./uploads');

// Importing models
const InstructorModel = require('../models/InstructorModel');
const LoginModel = require('../models/LoginModel');
const CourseModel = require('../models/CourseModel');
const LessonModel = require('../models/LessonModel');
const TopicsModel = require('../models/TopicsModel');
const AssignmentModel = require('../models/AssignmentModel');
const QuestionModel = require('../models/QuestionModel');
const EnrollModel = require('../models/EnrollModel');

// Importing the service function to check if the user is verified
const { checkVerify } = require("../services/getConfigstoreInstance");

// view for add instructor
const instructor = async (req, res) => {

    try {

        return res.render('instructor');

    } catch (error) {
        console.error('Error fetching instructor :', error);
    }
}

//  add instrucator
const instructordata = async (req, res) => {

    try {

        // Extract data from the request body
        const instructor = req.body.instructor
        const avatar = uploads + '/' + req.file.filename
        const degree = req.body.degree
        const speciality = req.body.speciality
        const about = req.body.about.replace(/"/g, '&quot;')

        let loginData = await LoginModel.findOne({ _id: req.session.userId });

        if (loginData && loginData.is_admin === 0) {
            if (fs.existsSync(avatar)) {
                fs.unlinkSync(avatar);
            }
            req.flash('error', 'You don\'t have permission to add instrucator. As a demo admin, you can only view the content.');
            return res.redirect('/instructor');
        }

        // save
        await InstructorModel.create({ instructor, avatar, degree, speciality, about });

        return res.redirect('/viewinstructor')

    } catch (error) {
        console.error('Error fetching instructor :', error);
    }
}

// view for all instructor
const viewinstructor = async (req, res) => {

    try {

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host')
        const verifyData = await checkVerify(currentUrl);

        const viewinstructor = await InstructorModel.find({});

        let loginData = await LoginModel.find({});

        return res.render('viewinstructor', { myinstructor: viewinstructor, loginData: loginData });

    } catch (error) {
        console.error('Error fetching instructor :', error);
    }
}

// delete instructor
const deleteinstructor = async (req, res) => {

    try {

        let id = req.query.id;

        const instrucator = await InstructorModel.findById(id);

        // Update courses to remove the instructor reference
        const updatedCourse = await CourseModel.updateMany({ instructorId: instrucator._id }, { $set: { instructorId: null } }, { new: true });

        if (instrucator) {
            if (fs.existsSync(instrucator.avatar)) {
                fs.unlinkSync(instrucator.avatar)
            }
        }

        // Delete instructor from the database
        await InstructorModel.deleteOne({ _id: instrucator._id });

        return res.redirect('/viewinstructor');

    } catch (error) {
        console.error('Error fetching instructor :', error);
    }
}

// view for edit instructor
const editinstructor = async (req, res) => {

    try {

        let id = req.query.id;

        const editinstructor = await InstructorModel.findById({ _id: id });

        return res.render('editinstructor', { editinstructor: editinstructor });

    } catch (error) {
        console.error('Error fetching instructor :', error);
    }
}

// edit instructor
const updateinstructor = async (req, res) => {

    try {

        let id = req.body.id;
        const instructor = req.body.instructor
        const degree = req.body.degree
        const speciality = req.body.speciality
        const about = req.body.about.replace(/"/g, '&quot;');
        const oldImage = req.body.oldImage;

        let avatar = oldImage;
        if (req.file) {
            if (fs.existsSync(oldImage)) {
                fs.unlinkSync(oldImage)
            }
            avatar = uploads + '/' + req.file.filename;;
        }

        // update instructor
        const updateinstructor = await InstructorModel.findByIdAndUpdate(id, { instructor, avatar, degree, speciality, about });

        return res.redirect('/viewinstructor');

    } catch (error) {
        console.error('Error fetching instructor :', error);
    }
}

module.exports = {
    instructor,
    instructordata,
    viewinstructor,
    deleteinstructor,
    editinstructor,
    updateinstructor
}