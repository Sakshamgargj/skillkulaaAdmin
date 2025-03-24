// Importing required modules 
const fs = require('fs');
const path = require('path');
const uploads = path.join('./uploads');

// Importing models
const CategoryModel = require('../models/CategoryModel');
const LoginModel = require('../models/LoginModel');
const CourseModel = require('../models/CourseModel');
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

// Importing the service function to check if the user is verified
const { checkVerify } = require("../services/getConfigstoreInstance");

// view for add category
const category = async (req, res) => {

    try {

        return res.render('category');

    } catch (error) {
        console.error('Error fetching category :', error);
    }
}

// add category
const categorydata = async (req, res) => {

    try {

        const category = req.body.category;
        const avatar = uploads + '/' + req.file.filename;

        let loginData = await LoginModel.findOne({ _id: req.session.userId });

        if (loginData && loginData.is_admin === 0) {
            if (fs.existsSync(avatar)) {
                fs.unlinkSync(avatar);
            }
            req.flash('error', 'You don\'t have permission to add category. As a demo admin, you can only view the content.');
            return res.redirect('/category');
        }

        await CategoryModel.create({ category, avatar });

        return res.redirect('/viewcategory');

    } catch (error) {
        console.error('Error fetching category :', error);
    }
}

// view for all category
const viewcategory = async (req, res) => {

    try {

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host')
        const verifyData = await checkVerify(currentUrl);

        const viewcategory = await CategoryModel.find({});

        const loginData = await LoginModel.find({});

        return res.render('viewcategory', { success: true, mycategory: viewcategory, loginData: loginData });

    } catch (error) {
        console.error('Error fetching category :', error);
    }
}

// Utility function to delete a file if it exists
const deleteFileIfExists = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const deletecategory = async (req, res) => {

    try {

        const id = req.query.id;

        const category = await CategoryModel.findById(id);

        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/viewcategory');
        }

        // Fetch courses under the category
        const courses = await CourseModel.find({ categoryId: category._id });

        // Loop through each course and delete associated data
        for (const course of courses) {
            const [sliders, lessons, assignments] = await Promise.all([
                SliderModel.find({ courseId: course._id }),
                LessonModel.find({ courseId: course._id }),
                AssignmentModel.find({ courseId: course._id })
            ]);

            // Delete slider images and slider records
            const sliderDeletionPromises = sliders.map(async (slider) => {
                deleteFileIfExists(slider.avatar); // Delete slider avatar if it exists
                return SliderModel.deleteOne({ _id: slider._id });
            });

            // Delete lessons, their avatars, and associated topics (including their files)
            const lessonDeletionPromises = lessons.map(async (lesson) => {
                const topics = await TopicsModel.find({ lessonId: lesson._id });

                const topicDeletionPromises = topics.map(async (topic) => {
                    deleteFileIfExists(topic.allfile);  // Delete topic files if they exist
                    deleteFileIfExists(topic.video);    // Delete topic videos if they exist
                    return TopicsModel.deleteOne({ _id: topic._id });
                });

                deleteFileIfExists(lesson.avatar); // Delete lesson avatar if it exists
                await Promise.all(topicDeletionPromises); // Wait for topic deletions
                return LessonModel.deleteOne({ _id: lesson._id }); // Delete lesson
            });

            // Delete assignments and their associated questions
            const assignmentDeletionPromises = assignments.map(async (assignment) => {
                await QuestionModel.deleteMany({ assignmentId: assignment._id }); // Delete associated questions
                return AssignmentModel.deleteOne({ _id: assignment._id }); // Delete assignment
            });

            // Update enrollments, certificates, and delete course avatar
            const enrollUpdatePromise = EnrollModel.updateMany(
                { courseId: course._id },
                { $set: { courseId: null } }
            );

            const certificateUpdatePromise = CertificateModel.updateMany(
                { courseId: course._id },
                { $set: { courseId: null } }
            );

            deleteFileIfExists(course.avatar); // Delete course avatar if it exists

            // Wait for all deletions related to the course to complete
            await Promise.all([
                ...sliderDeletionPromises,
                ...lessonDeletionPromises,
                ...assignmentDeletionPromises,
                enrollUpdatePromise,
                certificateUpdatePromise,
                FavouriteModel.deleteMany({ courseId: course._id }),
                ReviewModel.deleteMany({ courseId: course._id }),
                ReadModel.deleteMany({ courseId: course._id }),
                CompletedPercentageModel.deleteMany({ courseId: course._id }),
                AssignmentPercentageModel.deleteMany({ courseId: course._id }),
                AttemptAssignmentModel.deleteMany({ courseId: course._id })
            ]);

            // Finally, delete the course
            await CourseModel.deleteOne({ _id: course._id });
        }

        // Delete category avatar if it exists
        deleteFileIfExists(category.avatar);

        // Delete all courses associated with the category
        await CourseModel.deleteMany({ categoryId: category._id });

        // Delete the category itself
        await CategoryModel.deleteOne({ _id: category._id });

        // Redirect after successful deletion
        return res.redirect('/viewcategory');

    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).send('Server error during category deletion.');
    }
};

// view for edit category
const editcategory = async (req, res) => {

    try {

        let id = req.query.id;

        const editcategory = await CategoryModel.findById({ _id: id });

        return res.render('editcategory', { editcategory: editcategory });

    } catch (error) {
        console.error('Error fetching category :', error);
    }
}

// edit category
const updatecategory = async (req, res) => {

    try {

        let id = req.body.editid;
        const category = req.body.category;
        const oldImage = req.body.oldImage;

        let avatar = oldImage;
        if (req.file) {
            if (fs.existsSync(oldImage)) {
                fs.unlinkSync(oldImage)
            }
            avatar = uploads + '/' + req.file.filename;;
        }

        // update category
        const updatecategory = await CategoryModel.findByIdAndUpdate(id, { category, avatar }, { new: true });

        return res.redirect('/viewcategory');

    } catch (error) {
        console.error('Error fetching category :', error);
    }
}

// update category status
const updateCategoryStatus = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Validate id
        if (!id) {
            req.flash('error', 'Something went wrong. Please try again.');
            return res.redirect('/viewcategory');
        }

        // Find the current category using the ID
        const category = await CategoryModel.findById(id);

        // Check if category exists
        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/viewcategory');
        }

        // Toggle status
        const updatedCategory = await CategoryModel.findByIdAndUpdate(
            id,
            { status: category.status === "Publish" ? "UnPublish" : "Publish" },
            { new: true }
        );

        return res.redirect('/viewcategory');

    } catch (error) {
        console.error(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/viewcategory');
    }
}

module.exports = {
    category,
    categorydata,
    viewcategory,
    deletecategory,
    editcategory,
    updatecategory,
    updateCategoryStatus
}