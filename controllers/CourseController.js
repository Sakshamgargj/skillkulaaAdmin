// Importing models
const CourseModel = require('../models/CourseModel');
const CategoryModel = require('../models/CategoryModel');
const InstructorModel = require('../models/InstructorModel');
const LoginModel = require('../models/LoginModel');
const LessonModel = require('../models/LessonModel');
const TopicsModel = require('../models/TopicsModel');
const SliderModel = require('../models/SliderModel');
const AssignmentModel = require('../models/AssignmentModel');
const QuestionModel = require('../models/QuestionModel');
const EnrollModel = require('../models/EnrollModel');
const FavouriteModel = require('../models/FavouriteModel');
const ReviewModel = require('../models/ReviewModel');
const ReadModel = require("../models/ReadModel");
const CompletedPercentageModel = require('../models/CompletedPercentageModel');
const AttemptAssignmentModel = require('../models/AttemptAssignmentModel');
const AssignmentPercentageModel = require('../models/AssignmentPercentageModel');
const CertificateModel = require('../models/CertificateModel');

// Importing required modules 
const fs = require('fs');
const path = require('path');
const uploads = path.join('./uploads');


// Importing the service function to check if the user is verified
const { checkVerify } = require("../services/getConfigstoreInstance");

// view for add course
const course = async (req, res) => {

    try {

        const category = await CategoryModel.find({});

        const instructor = await InstructorModel.find({});

        return res.render('course', { categorydata: category, instructordata: instructor });

    } catch (error) {
        console.error('Error fetching course :', error);
    }
}

// add course
const coursedata = async (req, res) => {

    try {

        // Extract data from the request body
        const categoryId = req.body.categoryId;
        const instructorId = req.body.instructorId;
        const course = req.body.course;
        const avatar = `${uploads}/${req.file.filename}`;
        const videourl = req.body.videourl;
        const price = req.body.price;
        const level = req.body.level;
        const language = req.body.language;
        const about = req.body.about.replace(/"/g, '&quot;');
        const duration = req.body.duration;
        const skill = req.body.skill;
        const is_Certified = req.body.is_Certified;
        const is_Secure = req.body.is_Secure;

        let loginData = await LoginModel.findOne({ _id: req.session.userId });

        if (loginData && loginData.is_admin === 0) {
            if (fs.existsSync(avatar)) {
                fs.unlinkSync(avatar);
            }
            req.flash('error', 'You don\'t have permission to add course. As a demo admin, you can only view the content.');
            return res.redirect('/course');
        }

        // save course
        await CourseModel.create({
            categoryId: categoryId,
            instructorId: instructorId,
            course: course,
            avatar: avatar,
            videourl: videourl,
            price: price,
            level: level,
            language: language,
            about: about,
            duration: duration,
            skill: skill,
            is_Certified,
            is_Secure
        });

        // Redirecting to the view course page
        return res.redirect('/viewcourse');

    } catch (error) {
        console.error('Error fetching course :', error);
    }
}

// view for all course
const viewcourse = async (req, res) => {

    try {

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host')
        const verifyData = await checkVerify(currentUrl);

        const viewcourse = await CourseModel.find({}).populate(['categoryId', 'instructorId']);

        const loginData = await LoginModel.find({});

        return res.render('viewcourse', { success: true, mycourse: viewcourse, loginData: loginData });

    } catch (error) {
        console.error('Error fetching course :', error);
    }
}

// delete course 
const deletecourse = async (req, res) => {

    try {

        let id = req.query.id;
        let filter = { courseId: id };

        // Fetch course and associated data in parallel
        const [course, sliders, lessons, assignments] = await Promise.all([
            CourseModel.findById(id),
            SliderModel.find(filter),
            LessonModel.find({ courseId: id }),
            AssignmentModel.find({ courseId: id })
        ]);

        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/viewcourse');
        }

        // Delete slider images and records in parallel
        const sliderDeletionPromises = sliders.map(async (slider) => {
            if (fs.existsSync(slider.avatar)) {
                fs.unlinkSync(slider.avatar);
            }
            await SliderModel.deleteOne({ _id: slider._id });
        });

        // Delete lessons, their avatars, and topics (including their files) in parallel
        const lessonDeletionPromises = lessons.map(async (lesson) => {
            const topics = await TopicsModel.find({ lessonId: lesson._id });

            const topicDeletionPromises = topics.map(async (topic) => {
                if (topic.allfile && fs.existsSync(topic.allfile)) {
                    fs.unlinkSync(topic.allfile);
                }
                if (topic.video && fs.existsSync(topic.video)) {
                    fs.unlinkSync(topic.video);
                }
                await TopicsModel.deleteOne({ _id: topic._id });
            });

            if (lesson.avatar && fs.existsSync(lesson.avatar)) {
                fs.unlinkSync(lesson.avatar);
            }

            await Promise.all(topicDeletionPromises);
            await LessonModel.deleteOne({ _id: lesson._id });
        });

        // Delete assignments and their associated questions
        const assignmentDeletionPromises = assignments.map(async (assignment) => {
            await QuestionModel.deleteMany({ assignmentId: assignment._id });
            await AssignmentModel.deleteOne({ _id: assignment._id });
        });

        // Update enrollments in parallel
        const enrollUpdatePromise = EnrollModel.updateMany(
            { courseId: id },
            { $set: { courseId: null } }
        );

        // Delete course avatar if it exists
        if (course.avatar && fs.existsSync(course.avatar)) {
            fs.unlinkSync(course.avatar);
        }

        // Wait for all deletions to complete
        await Promise.all([
            ...sliderDeletionPromises,
            ...lessonDeletionPromises,
            ...assignmentDeletionPromises,
            enrollUpdatePromise
        ]);

        // Additional deletions (handled in parallel)
        await Promise.all([
            FavouriteModel.deleteMany({ courseId: course._id }),
            ReviewModel.deleteMany({ courseId: course._id }),
            ReadModel.deleteMany({ courseId: course._id }),
            CompletedPercentageModel.deleteMany({ courseId: course._id }),
            AssignmentPercentageModel.deleteMany({ courseId: course._id }),
            AttemptAssignmentModel.deleteMany({ courseId: course._id })
        ]);

        // fetch certificets
        const certifcates = await CertificateModel.updateMany({ courseId: id }, { $set: { courseId: null } }, { new: true });

        // Finally, delete the course itself
        await CourseModel.deleteOne({ _id: course._id });

        // Redirect to viewcourse after successful deletion
        return res.redirect('/viewcourse');

    } catch (error) {
        console.error('Error deleting course:', error);
    }
};

// view for edit course
const editcourse = async (req, res) => {

    try {

        let id = req.query.id;

        const editcourse = await CourseModel.findById({ _id: id }).populate(['categoryId', 'instructorId']);

        const categorydata = await CategoryModel.find({});

        const instructordata = await InstructorModel.find({});

        const course = await CourseModel.find({});

        return res.render('editcourse', { editcourse: editcourse, categorydata: categorydata, instructordata: instructordata, course: course });

    } catch (error) {
        console.error('Error fetching course :', error);
    }
}

// edit course
const updatecourse = async (req, res) => {

    try {

        let id = req.body.editid;
        const categoryId = req.body.categoryId;
        const instructorId = req.body.instructorId;
        const course = req.body.course;
        const videourl = req.body.videourl;
        const price = req.body.price;
        const level = req.body.level;
        const language = req.body.language;
        const about = req.body.about.replace(/"/g, '&quot;');
        const duration = req.body.duration;
        const skill = req.body.skill;
        const oldImage = req.body.oldImage;
        const is_Certified = req.body.is_Certified;
        const is_Secure = req.body.is_Secure;

        let avatar = oldImage;
        if (req.file) {
            if (fs.existsSync(oldImage)) {
                fs.unlinkSync(oldImage)
            }
            avatar = uploads + '/' + req.file.filename;;
        }

        // update course
        const updatecourse = await CourseModel.findByIdAndUpdate(id, {
            categoryId: categoryId,
            instructorId: instructorId,
            course: course,
            avatar: avatar,
            videourl: videourl,
            price: price,
            level: level,
            language: language,
            about: about,
            duration: duration,
            skill: skill,
            is_Certified,
            is_Secure
        }, { new: true });

        return res.redirect('/viewcourse');

    } catch (error) {
        console.error('Error fetching course :', error);
    }
}

const certified = async (req, res) => {
    const { id } = req.params;
    try {
        const course = await CourseModel.findById(id);
        if (!course) {
            return res.sendStatus(404);
        }

        course.is_Certified = !course.is_Certified;
        await course.save();

        res.redirect('/viewcourse');
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

const secure = async (req, res) => {
    const { id } = req.params;
    try {
        const course = await CourseModel.findById(id);
        if (!course) {
            return res.sendStatus(404);
        }
        course.is_Secure = !course.is_Secure;
        await course.save();

        res.redirect('/viewcourse');
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

// update course status
const updateCourseStatus = async (req, res) => {

    try {
        // Extract data from the request query
        const id = req.query.id;

        // Validate id
        if (!id) {
            req.flash('error', 'Something went wrong. Please try again.');
            return res.redirect('/viewcourse');
        }

        // Find the current course using the ID
        const course = await CourseModel.findById(id);

        // Check if course exists
        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/viewcourse');
        }

        // Toggle status
        const updatedCourse = await CourseModel.findByIdAndUpdate(
            id,
            { status: course.status === "Publish" ? "UnPublish" : "Publish" },
            { new: true }
        );

        return res.redirect('/viewcourse');

    } catch (error) {
        console.error(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/viewcourse');
    }
}


module.exports = {
    course,
    coursedata,
    viewcourse,
    deletecourse,
    editcourse,
    updatecourse,
    certified,
    secure,
    updateCourseStatus,
}