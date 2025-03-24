// Importing required modules 
const fs = require('fs');
const path = require('path');
const uploads = path.join('./uploads');

// Importing models
const SliderModel = require('../models/SliderModel');
const CourseModel = require('../models/CourseModel');
const LoginModel = require('../models/LoginModel');

// Importing the service function to check if the user is verified
const { checkVerify } = require("../services/getConfigstoreInstance");

// view for add slider
const slider = async (req, res) => {

    try {

        const course = await CourseModel.find({});

        return res.render('slider', { coursedata: course });

    } catch (error) {
        console.error('Error fetching slider :', error);
    }
}

// add  slider
const sliderdata = async (req, res) => {

    try {

        // Extract data from the request body
        const courseId = req.body.courseId;
        const avatar = uploads + '/' + req.file.filename;

        let loginData = await LoginModel.findOne({ _id: req.session.userId });

        if (loginData && loginData.is_admin === 0) {
            if (fs.existsSync(avatar)) {
                fs.unlinkSync(avatar);
            }
            req.flash('error', 'You don\'t have permission to add slider As a demo admin, you can only view the content.');
            return res.redirect('/slider');
        }

        // save slider
        const saveSilder = await new SliderModel({ courseId, avatar }).save();

        return res.redirect('/viewslider');

    } catch (error) {
        console.error('Error fetching slider :', error);
    }
}

// view for  view all silder
const loadSilder = async (req, res) => {

    try {

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host')
        const verifyData = await checkVerify(currentUrl);

        const sliders = await SliderModel.find({}).populate('courseId');

        const loginData = await LoginModel.find({});

        return res.render('viewslider', { sliders: sliders, loginData: loginData });

    } catch (error) {
        console.error('Error fetching slider :', error);
    }
}

//  view for  edit slider
const editslider = async (req, res) => {

    try {

        let id = req.query.id;

        const editslider = await SliderModel.findById({ _id: id }).populate('courseId');

        const coursedata = await CourseModel.find({});

        return res.render('editslider', { editslider: editslider, coursedata: coursedata });

    } catch (error) {
        console.error('Error fetching slider :', error);
    }
}

// edit slider
const updateslider = async (req, res) => {

    try {

        // Extract data from the request body
        const id = req.body.id;
        const courseId = req.body.courseId;
        const oldImage = req.body.oldImage;

        let avatar = oldImage;
        if (req.file) {
            if (fs.existsSync(oldImage)) {
                fs.unlinkSync(oldImage)
            }
            avatar = uploads + '/' + req.file.filename;
        }

        // update slider
        const updateSlider = await SliderModel.findByIdAndUpdate(id, { courseId, avatar }, { new: true })

        return res.redirect('/viewslider');

    } catch (error) {
        console.error('Error fetching slider :', error);
    }
}

// delete slider
const deleteslider = async (req, res) => {

    try {

        let id = req.query.id;

        const deleteImg = await SliderModel.findById(id);

        if (deleteImg) {
            if (fs.existsSync(deleteImg.avatar)) {
                fs.unlinkSync(deleteImg.avatar)
            }
        }

        const deletedSlider = await SliderModel.findByIdAndDelete(id);

        return res.redirect('/viewslider');

    } catch (error) {
        console.error('Error fetching course :', error);
    }
}

// update silder status
const updateSilderStatus = async (req, res) => {

    try {

        // Extract data from the request query
        const id = req.query.id;

        // Validate id
        if (!id) {
            req.flash('error', 'Something went wrong. Please try again.');
            return res.redirect('/viewslider');
        }

        // Find the current level using the ID
        const silder = await SliderModel.findById(id);

        // Check if level exists
        if (!silder) {
            req.flash('error', 'silder not found');
            return res.redirect('/viewslider');
        }

        // Toggle status
        const updatedSilder = await SliderModel.findByIdAndUpdate(
            id,
            { status: silder.status === "Publish" ? "UnPublish" : "Publish" },
            { new: true }
        );

        return res.redirect('/viewslider');

    } catch (error) {
        console.error(error.message);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/viewslider');
    }
}

module.exports = {

    slider,
    sliderdata,
    loadSilder,
    editslider,
    updateslider,
    deleteslider,
    updateSilderStatus
}