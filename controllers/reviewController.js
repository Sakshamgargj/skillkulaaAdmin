// Importing models
const LoginModel = require('../models/LoginModel');
const ReviewModel = require("../models/ReviewModel");

// Importing the service function to check if the user is verified
const { checkVerify } = require("../services/getConfigstoreInstance");

// Load and render the view for review
const loadReview = async (req, res) => {

    try {

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host')
        const verifyData = await checkVerify(currentUrl);

        // fetch all review
        const reviews = await ReviewModel.find().populate("userId courseId");

        const loginData = await LoginModel.find();

        return res.render("review", { reviews, loginData });

    } catch (error) {
        console.log(error.message);
    }
}

// For publish review
const isPublishReview = async (req, res) => {

    try {

        let loginData = await LoginModel.findOne({ _id: req.session.userId });

        if (loginData && loginData.is_admin === 0) {
            req.flash('error', 'You don\'t have permission to publish/unpulish review. As a demo admin, you can only view the content.');
            return res.redirect('/review');
        }

        // Extract data from the request
        const id = req.query.id;

        // Find current images
        const currentReview = await ReviewModel.findById({ _id: id });

        await ReviewModel.findByIdAndUpdate({ _id: id }, { $set: { isPublish: currentReview.isPublish === false ? true : false } }, { new: true });

        return res.redirect('/review');

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {

    loadReview,
    isPublishReview
}