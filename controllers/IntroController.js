// Importing required modules 
const fs = require('fs');
const path = require('path');
const uploads = path.join('./uploads')

// Importing models
const IntroModel = require('../models/IntroModel');
const LoginModel = require('../models/LoginModel');

// Importing the service function to check if the user is verified
const { checkVerify } = require("../services/getConfigstoreInstance");

// view for add intro
const intro = async (req, res) => {

    try {

        return res.render('intro');

    } catch (error) {
        console.error('Error fetching intro :', error);
    }
}

// add intro
const introdata = async (req, res) => {

    try {

        // Extract data from the request body
        const intro = req.body.intro;
        const avatar = uploads + '/' + req.file.filename;
        const description = req.body.description.replace(/"/g, '&quot;')

        let loginData = await LoginModel.findOne({ _id: req.session.userId });

        if (loginData && loginData.is_admin === 0) {
            if (fs.existsSync(avatar)) {
                fs.unlinkSync(avatar);
            }
            req.flash('error', 'You don\'t have permission to add intro. As a demo admin, you can only view the content.');
            return res.redirect('/intro');
        }

        // save intro 
        await IntroModel.create({ intro, avatar, description });

        return res.redirect("/viewintro")
    } catch (error) {
        console.error('Error fetching intro :', error);
    }
}

// view for all intro
const viewintro = async (req, res) => {

    try {

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host')
        const verifyData = await checkVerify(currentUrl);

        const viewintro = await IntroModel.find({});

        const loginData = await LoginModel.find({});

        return res.render('viewintro', { myintro: viewintro, loginData: loginData });

    } catch (error) {
        console.error('Error fetching intro :', error);
    }
}

// delete intro
const deleteintro = async (req, res) => {

    try {

        let id = req.query.id;

        const deleteImg = await IntroModel.findById(id);

        if (deleteImg) {
            if (fs.existsSync(deleteImg.avatar)) {
                fs.unlinkSync(deleteImg.avatar)
            }
        }

        await IntroModel.findByIdAndDelete(id);

        return res.redirect('/viewintro');

    } catch (error) {
        console.error('Error fetching intro :', error);
    }
}

// view for edit intro
const editintro = async (req, res) => {

    try {

        let id = req.query.id;

        const editintro = await IntroModel.findById({ _id: id });

        return res.render('editintro', { editintro: editintro });

    } catch (error) {
        console.error('Error fetching intro :', error);
    }
}

// edit intro
const updateintro = async (req, res) => {

    try {

        // Extract data from the request body
        const id = req.body.id;
        const intro = req.body.intro;
        const description = req.body.description.replace(/"/g, '&quot;')
        const oldImage = req.body.oldImage;

        let avatar = oldImage;
        if (req.file) {
            if (fs.existsSync(oldImage)) {
                fs.unlinkSync(oldImage)
            }
            avatar = uploads + '/' + req.file.filename;
        }

        // update intro
        const updatedintro = await IntroModel.findByIdAndUpdate(id, { intro, avatar, description }, { new: true })

        return res.redirect('/viewintro');

    } catch (error) {
        console.error('Error fetching intro :', error);
    }
}

module.exports = {
    intro,
    introdata,
    viewintro,
    deleteintro,
    editintro,
    updateintro
}