// Importing required modules 
const express = require("express");
const path = require('path');
const multer = require('multer');

// Configure dotenv
require('dotenv').config();

// Create an instance of the express router
const routes = express.Router();

const storage = multer.diskStorage({
    destination: (req, res, cb) => {
        cb(null, path.join(__dirname, '../uploads'))
    },
    filename: (req, file, cb) => {
        // Get the current timestamp
        const timestamp = Date.now();
        // Get the current file originalname
        const originalname = file.originalname;
        // Get the file extension
        const extension = originalname.split('.').pop();

        const sanitizedOriginalName = file.originalname.replace(/\s+/g, '-');
        //Get create new name for file
        const newFilename = `${timestamp}_${sanitizedOriginalName}`;
        cb(null, newFilename);
    }
});

const uploadfile = multer({ storage: storage });

// Importing middleware functions for check user authentication
const { checkAuthentication } = require("../middleware/checkAuthentication");

// Import controllers
const APIController = require('../controllers/APIController');

// Routes For Sign In 
routes.post('/checkregisteruser', APIController.checkregisteruser);

routes.post('/signup', APIController.signup);

routes.post('/verifyotp', APIController.verifyotp);

// Routes For Sign In
routes.post("/signIn", APIController.signin);

routes.post("/isVerifyAccount", APIController.isVerifyAccount);

routes.post("/resendOtp", APIController.resendOtp);

// Routes For Forgot Password
routes.post('/forgotpassword', APIController.forgotpassword);

routes.post('/forgotPasswordVerification', APIController.forgotPasswordVerification);

routes.post("/resetPassword", APIController.resetPassword);

// Routes For Change Password
routes.post('/changepassword', checkAuthentication, APIController.changepassword);

// Routes For User Edit
routes.post('/getuser', checkAuthentication, APIController.getuser);

routes.post('/image', checkAuthentication, uploadfile.single('avatar'), APIController.image);

routes.post('/useredit', checkAuthentication, APIController.useredit);

routes.post('/deleteaccount', checkAuthentication, APIController.deleteaccount);

// Routes For Intro
routes.post('/intro', APIController.intro);

// Routes For Slider
routes.post('/slider', APIController.slider);

// Routes For Category
routes.post('/category', APIController.category);

// Routes For Instructor
routes.post('/instructor', APIController.instructor);

// Routes For Course
routes.post('/course', APIController.course);

routes.post('/trendingcourse', APIController.trendingCourse);

// Routes For Lesson
routes.post('/lesson', APIController.lesson);

routes.post('/readlesson', checkAuthentication, APIController.readlesson);

// Routes For  enroll a user in a course
routes.post('/enroll', checkAuthentication, APIController.enroll);

routes.post('/mycourselist', checkAuthentication, APIController.mycourselist);

routes.post('/completedcourse', checkAuthentication, APIController.completedcourse);

// Routes For Assignment
routes.post('/getassignment', checkAuthentication, APIController.getassignment);

routes.post('/getquestions', checkAuthentication, APIController.getQuestions);

routes.post('/assignment', checkAuthentication, APIController.assignment);

routes.post('/getresult', checkAuthentication, APIController.getresult);

routes.post('/getAssignmentScore', checkAuthentication, APIController.getAssignmentScore);

// Routes For Certificate
routes.post('/getcertificate', checkAuthentication, APIController.getcertificate);

routes.post('/getcertificate_list', checkAuthentication, APIController.getcertificateList);

// Routes For Review
routes.post('/review', checkAuthentication, APIController.review);

// Routes For Notification
routes.post("/getAllNotification", checkAuthentication, APIController.getAllNotification);

//  Routes For Favourite Course
routes.post('/favourite', checkAuthentication, APIController.favourite);

routes.post('/getfavourite', checkAuthentication, APIController.getfavourite);

routes.post('/unfavourite', checkAuthentication, APIController.unfavourite);

// Routes For Payment gateway
routes.post('/payment_method', checkAuthentication, APIController.paymentmethod);

// Routes For Currency
routes.post('/currency', APIController.getCurrency);

// Routes For Page
routes.post("/getPage", APIController.getPage);

// Routes For Chat
routes.post('/userchat', checkAuthentication, APIController.userchat);

routes.post('/getallchat', checkAuthentication, APIController.getallchat);

// Routes For temporary
routes.post("/getOtp", APIController.getOtp);

routes.post("/getForgotPasswordOtp", APIController.getForgotPasswordOtp);

module.exports = routes;
