// Importing required modules 
const fs = require('fs');
const path = require('path');
const uploads = path.join('./uploads');

// Importing models
const LessonModel = require('../models/LessonModel');
const CourseModel = require('../models/CourseModel');
const LoginModel = require('../models/LoginModel');
const TopicsModel = require('../models/TopicsModel');
const ReadModel = require("../models/ReadModel");
const CompletedPercentageModel = require('../models/CompletedPercentageModel');
const AttemptAssignmentModel = require('../models/AttemptAssignmentModel');
const AssignmentPercentageModel = require('../models/AssignmentPercentageModel');
const CertificateModel = require('../models/CertificateModel');

// view for add lesson
const lesson = async (req, res) => {

    try {

        // Extract data from the request query
        const courseId = req.query.id;
        const courseName = req.query.name;
        
        // fetch course
        const courses = await CourseModel.find({ status: "Publish" });

        return res.render('lesson', { coursedata: courses, courseId: courseId, courseName });

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

// add lesson
const lessondata = async (req, res) => {

    try {

        // Extract data from request body
        const courseId = req.body.courseId;
        const courseName = req.body.courseName;
        const lesson = req.body.lesson;
        const avatar = uploads + '/' + req.file.filename

        // save lesson
        const lessonData = await new LessonModel({ courseId, lesson, avatar }).save();

        return res.redirect(`/viewlesson?id=${req.body.courseId}&name=${courseName}`);

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

// View for all lessons but particularly course
const viewlesson = async (req, res) => {

    try {

        // Extract data from request query
        const courseId = req.query.id
        const courseName = req.query.name
        
        // fetch lesson specific course
        const viewlesson = await LessonModel.find({ courseId: req.query.id }).populate('courseId');

        // fetch login
        const loginData = await LoginModel.find({});

        return res.render('viewlesson', { mylesson: viewlesson, loginData: loginData, courseid: courseId, courseName: courseName });

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

// Helper function to delete a file if it exists
const deleteFileIfExists = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const deletelesson = async (req, res) => {

    try {
        
        const { id, courseId } = req.query;

        // Fetch lesson and course details
        const lesson = await LessonModel.findById(id).populate("courseId", "course _id");

        if (!lesson) {
            req.flash('error', 'Lesson not found.');
            return res.redirect(`/viewlesson?id=${courseId}`);
        }

        // Fetch all topics for the lesson
        const topics = await TopicsModel.find({ lessonId: lesson._id });

        // Handle topics deletion in parallel
        const topicDeletionPromises = topics.map(async (topic) => {
            deleteFileIfExists(topic.allfile);  // Delete allfile
            deleteFileIfExists(topic.video);    // Delete video file
            return TopicsModel.deleteOne({ _id: topic._id });  // Delete the topic
        });

        // Delete lesson avatar if it exists
        deleteFileIfExists(lesson.avatar);

        // Delete related data in parallel
        const relatedDeletions = Promise.all([
            ReadModel.deleteMany({ courseId: lesson.courseId._id }),
            CompletedPercentageModel.deleteMany({ courseId: lesson.courseId._id }),
            AssignmentPercentageModel.deleteMany({ courseId: lesson.courseId._id }),
            AttemptAssignmentModel.deleteMany({ courseId: lesson.courseId._id }),
        ]);

        // Fetch certificates related to the course
        const certificates = await CertificateModel.find({ courseId: lesson.courseId._id });

        // Delete certificate images and certificates in parallel
        const certificateDeletionPromises = certificates.map(async (certificate) => {
            deleteFileIfExists(certificate.imagePath);  // Delete certificate image
        });
        const certificateDeletion = CertificateModel.deleteMany({ courseId: lesson.courseId._id });

        // Execute all deletions in parallel
        await Promise.all([
            ...topicDeletionPromises,
            relatedDeletions,
            ...certificateDeletionPromises,
            certificateDeletion,
            LessonModel.deleteOne({ _id: lesson._id })  // Delete the lesson
        ]);

        // Redirect back to the course lessons page
        return res.redirect(`/viewlesson?id=${courseId}&name=${lesson.courseId.course}`);

    } catch (error) {
        console.error('Error deleting lesson:', error);
        return res.status(500).send('Server error during lesson deletion.');
    }
};

// view for edit lesson
const editlesson = async (req, res) => {

    try {

        let id = req.query.id;

        const editlesson = await LessonModel.findById({ _id: id }).populate('courseId');

        const coursedata = await CourseModel.find({ status: "Publish" });

        return res.render('editlesson', { editlesson: editlesson, coursedata: coursedata });

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

// edit lesson
const updatelesson = async (req, res) => {

    try {

        // Extract data from the request body
        const id = req.body.id;
        const courseId = req.body.courseId;
        const lesson = req.body.lesson;
        const oldImage = req.body.oldImage;

        let avatar = oldImage;
        if (req.file) {
            // delete old image
            if (fs.existsSync(oldImage)) {
                fs.unlinkSync(oldImage)
            }
            avatar = uploads + '/' + req.file.filename;;
        }

        // update lesson
        const updatelesson = await LessonModel.findByIdAndUpdate(id, { courseId, lesson, avatar }, { new: true }).populate("courseId", "course");

        return res.redirect(`/viewlesson?id=${courseId}&name=${updatelesson.courseId.course}`);

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

module.exports = {

    lesson,
    lessondata,
    viewlesson,
    deletelesson,
    editlesson,
    updatelesson

}