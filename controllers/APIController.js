// Importing required modules 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const otpgenerator = require('otp-generator');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const uploads = path.join('./uploads');
const { createCanvas, loadImage, registerFont } = require('canvas');

// Importing models
const UserModel = require('../models/UserModel');
const OtpModel = require('../models/OtpModel');
const forgotPasswordOtpModel = require("../models/forgotPasswordOtpModel");
const SliderModel = require('../models/SliderModel');
const CategoryModel = require('../models/CategoryModel');
const InstructorModel = require('../models/InstructorModel');
const CourseModel = require('../models/CourseModel');
const Lessonmodel = require('../models/LessonModel');
const TopicModel = require('../models/TopicsModel');
const EnrollModel = require('../models/EnrollModel');
const ReviewModel = require('../models/ReviewModel');
const ReadModel = require('../models/ReadModel');
const Currency = require('../models/currencyModel');
const FavouriteModel = require('../models/FavouriteModel');
const ChatModel = require('../models/ChatModel');
const CompletedPercentageModel = require('../models/CompletedPercentageModel');
const AttemptAssignmentModel = require('../models/AttemptAssignmentModel');
const AssignmentModel = require('../models/AssignmentModel');
const QuestionModel = require('../models/QuestionModel');
const CertificateModel = require('../models/CertificateModel');
const AssignmentPercentageModel = require('../models/AssignmentPercentageModel');
const IntroModel = require('../models/IntroModel');
const Payment = require("../models/paymentMethodModel");
const userNotificationModel = require("../models/userNotificationModel");
const pageModel = require("../models/pageModel");
const notificationModel = require('../models/notificationModel');
const verificationModel = require("../models/verificationModel");

// Configure dotenv
require('dotenv').config();

// Importing the function to send otp mail
const sendOtpMail = require("../services/sendOtpMail");
// Importing the function to combine courses review
const combineCoursesReview = require("../services/combineCoursesReview");

// Importing the function to send notification
const { sendAdminNotification, sendUserNotification } = require("../services/sendPushNotification");


// Defining the path where uploaded images are stored
const imagePath = './uploads/'

// hash password
const securePassword = async (password) => {

    try {

        const passwordHash = await bcrypt.hash(password, 10);

        return passwordHash;

    } catch (error) {
        console.log(error);
    }
}

//check register user
const checkregisteruser = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        const email = req.body.email;

        if (!email) return res.json({ data: { success: 0, message: "Email is required", error: 1 } });

        const existemail = await UserModel.findOne({ email });

        if (existemail) return res.json({ data: { success: 0, message: "User already exists", error: 1 } });

        return res.json({ data: { success: 1, message: "User does not exist, please sign up", error: 0 } });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

//sign up
const signup = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const firstname = req.body.firstname;
        const lastname = req.body.lastname;
        const email = req.body.email;
        const password = req.body.password;
        const country_code = req.body.country_code;
        const phone = req.body.phone;

        // hash password
        const hashPassword = await securePassword(password);

        // Check if user already exists
        let existingUser = await UserModel.findOne({ email });

        if (existingUser) return res.json({ data: { success: 0, message: "User already exists", error: 1 } });

        // generate otp
        const otp = otpgenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

        // Save OTP 
        const otpDoc = await OtpModel.findOneAndUpdate({ email: email }, { $set: { email: email, otp: otp, } }, { upsert: true, new: true, });

        //send mail for otp
        await sendOtpMail(otp, email, firstname, lastname);

        // save user 
        const saveUser = await new UserModel({ firstname, lastname, email, phone, password: hashPassword, country_code }).save();

        if (!saveUser) return res.json({ data: { success: 0, message: "Sign-up unsuccessful. Please try again later.", error: 1 } });

        return res.json({ data: { success: 1, message: "Successfully signed up! Please check your email to verify OTP.", error: 0 } });

    } catch (error) {
        console.log("Error during sign up:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// Function to send OTP verification email
const verifyotp = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const email = req.body.email;
        const otp = req.body.otp;

        // Validate email and otp
        if (!email || !otp) return res.json({ data: { success: 0, message: "Email and OTP is required", error: 1 } });

        // Check if there is an OTP record for the given email
        const user = await OtpModel.findOne({ email: email });

        if (!user) return res.json({ data: { success: 0, message: "Email not found. Please try again...", error: 1 } });

        if (otp !== user.otp) return res.json({ data: { success: 0, message: "Incorrect OTP. Please try again...", error: 1 } });

        // Update the otp verify status
        const updatedUser = await UserModel.findOneAndUpdate({ email }, { $set: { isVerified: 1 } });

        // Generate token
        const token = jwt.sign({ id: updatedUser._id, email }, process.env.JWT_SECRET_KEY);

        // Exclude sensitive fields from the user object
        const filteredUser = {
            _id: updatedUser._id,
            firstname: updatedUser.firstname,
            lastname: updatedUser.lastname,
            email: updatedUser.email,
            country_code: updatedUser.country_code,
            phone: updatedUser.phone,
            active: updatedUser.active
        };

        // Delete otp
        await OtpModel.deleteOne({ email });

        // Update user notification data
        const { registrationToken, deviceId } = req.body;

        await userNotificationModel.updateOne({ userId: updatedUser._id, deviceId }, { $set: { registrationToken } }, { upsert: true });

        return res.json({ data: { success: 1, message: "OTP verified successfully", token, user: filteredUser, error: 0 } });

    } catch (error) {
        console.log("Error during otp verify:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// sign In
const signin = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request
        const email = req.body.email;
        const password = req.body.password;

        // Validate email and password
        if (!email || !password) return res.json({ data: { success: 0, message: "Email and password is required", error: 1 } });

        // fetch particular user
        const user = await UserModel.findOne({ email: email });

        if (!user) return res.json({ data: { success: 0, message: "We're sorry, something went wrong when attempting to sign in.", error: 1 } });

        // compare password
        if (user.active !== true)
            return res.json({ data: { success: 0, message: "Your account has been disactive. Please contact support for more details.", error: 1 } });

        // compare password
        const passwordmatch = await bcrypt.compare(password, user.password);

        if (!passwordmatch) return res.json({ data: { success: 0, message: "We're sorry, something went wrong when attempting to sign in.", error: 1 } });

        // generate token
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET_KEY);

        // Exclude sensitive fields from the user object
        const filteredUser = {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            country_code: user.country_code,
            phone: user.phone,
            active: user.active
        };

        // Update user notification data
        const { registrationToken, deviceId } = req.body;

        await userNotificationModel.updateOne({ userId: user._id, deviceId }, { $set: { registrationToken } }, { upsert: true });

        // response based on user verification status
        if (!user.isVerified) {

            return res.json({ data: { success: 1, message: "Login successful ..., but your account is pending verification. Please check your email to complete the verification process.", token, user: filteredUser, error: 0 } });
        }
        else {

            return res.json({ data: { success: 1, message: "Logged in successfully.", token, user: filteredUser, error: 0 } });
        }

    } catch (error) {
        return res.json({ data: { success: 0, message: 'User not registered!', error: 1 } });
    }
}

// is verify account
const isVerifyAccount = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const email = req.body.email;

        // Validate email
        if (!email) {
            return res.json({ data: { success: 0, message: "Email is required", error: 1 } });
        }

        // fetch user
        const existingUser = await UserModel.findOne({ email: email });

        if (!existingUser) {
            return res.json({ data: { success: 0, message: "User not found", error: 1 } });
        }

        if (!existingUser.isVerified) {
            return res.json({ data: { success: 0, message: "Your account is not verified. Please verify your account...", error: 1 } });
        }
        else {

            return res.json({ data: { success: 1, message: "Your account has been successfully verified.", error: 0 } });
        }

    } catch (error) {
        console.log("Error during is verify account", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// resend otp
const resendOtp = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const email = req.body.email;

        // Validate email
        if (!email) {
            return res.json({ data: { success: 0, message: "Email is required", error: 1 } });
        }

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email: email });

        if (!existingUser) {
            return res.json({ data: { success: 0, message: "User not found", error: 1 } });
        }

        if (existingUser.isVerified === 1) {
            return res.json({ data: { success: 0, message: "Your account is already verified.", error: 1 } });
        }

        // generate otp
        const otp = otpgenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

        // Save OTP 
        const otpDoc = await OtpModel.findOneAndUpdate({ email: email }, { $set: { email: email, otp: otp, } }, { new: true, upsert: true });

        // Send OTP email
        try {

            await sendOtpMail(otp, email, existingUser.firstname, existingUser.lastname);

        } catch (emailError) {
            return res.json({ data: { success: 0, message: "Something went wrong. Please try again...", error: 1 } });
        }

        return res.json({ data: { success: 1, message: "We've sent an OTP to your email. Please check your inbox to verify your account.", error: 0 } });

    } catch (error) {
        console.log("Error during verify Account", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// forgot password
const forgotpassword = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request
        const email = req.body.email;

        // Check if email already exists or not
        const isExistEmail = await UserModel.findOne({ email });

        if (!isExistEmail) return res.json({ data: { success: 0, message: "Incorrect Email, Please try again", error: 1 } });

        // generate otp
        const otp = otpgenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

        // save OTP
        let otpRecord = await forgotPasswordOtpModel.findOneAndUpdate({ email }, { otp }, { upsert: true, new: true });

        // Send OTP email
        try {

            await sendOtpMail(otp, email, isExistEmail.firstname, isExistEmail.lastname);

        } catch (emailError) {
            return res.json({ data: { success: 0, message: "Something went wrong. Please try again...", error: 1 } });
        }

        return res.json({ data: { success: 1, message: "We've sent an OTP to your email. Please check your inbox to reset your password.", error: 0 } });

    } catch (error) {
        console.log("Error during forgot password:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } })
    }
}

//forgot password verification
const forgotPasswordVerification = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request
        const email = req.body.email;
        const otp = req.body.otp;

        // Check if there is an OTP record for the given email
        const isExistEmail = await forgotPasswordOtpModel.findOne({ email });

        if (!isExistEmail) return res.json({ data: { success: 0, message: "Invalid Email. Please try again.", error: 1 } });

        // Check if the provided OTP matches the stored OTP
        if (otp !== isExistEmail.otp) return res.json({ data: { success: 0, message: "Invalid Otp. Please try again.", error: 1 } });

        // Update the OTP verify status
        const isVerify = await forgotPasswordOtpModel.findOneAndUpdate({ email: email }, { $set: { isVerified: 1 } });

        return res.json({ data: { success: 1, message: "OTP verified successfully.", error: 0 } });

    } catch (error) {
        console.log("Error during forgot password verification", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

//reset password 
const resetPassword = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request
        const email = req.body.email;
        const new_password = req.body.new_password;

        // hash password
        const hashPassword = await securePassword(new_password);

        // Check if there is an OTP record for the given email
        const isExistEmail = await forgotPasswordOtpModel.findOne({ email });

        if (!isExistEmail) {
            return res.json({ data: { success: 0, message: "Invalid Email. Please try again.", error: 1 } });
        }

        // Check if the user's OTP is not verified
        if (isExistEmail.isVerified !== 1) {
            return res.json({ data: { success: 0, message: "Please Verify Your OTP", error: 1 } });
        }

        //update password
        const updatePassword = await UserModel.findOneAndUpdate({ email: email }, { $set: { password: hashPassword } });

        // Delete the OTP record from the OTP model after verification
        await forgotPasswordOtpModel.deleteOne({ email: email });

        return res.json({ data: { success: 1, message: "Successfully Reset Password !!", error: 0 } });

    } catch (error) {
        console.log("Error during reset password", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// change password
const changepassword = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request
        const userId = req.user;

        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        // compare
        if (newPassword !== confirmPassword) return res.json({ data: { success: 0, message: "Confirm password does not match", error: 1 } });

        // fetch user password
        const userData = await UserModel.findById(userId);

        // compare password
        const passwordMatch = await bcrypt.compare(currentPassword, userData.password);

        if (!passwordMatch) return res.json({ data: { success: 0, message: "Incorrect current password. Please enter the correct password and try again...", error: 1 } });

        // Hash password
        const hashedPassword = await securePassword(newPassword);

        // update password
        const updatedPassword = await UserModel.findByIdAndUpdate({ _id: userId }, { $set: { password: hashedPassword } }, { new: true });

        return res.json({ data: { success: 1, message: "Password changed successfully", error: 0 } });

    }
    catch (error) {
        console.log("Error during change password:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

//get user
const getuser = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the body
        const userId = req.user;

        // Find user in the database using the provided ID
        const user = await UserModel.findOne({ _id: userId }, { password: 0, isVerified: 0 });

        // Check if the user is not found
        if (!user) {

            return res.json({ data: { success: 0, message: "User Not Found", user: user, error: 1 } });
        }
        else {

            return res.json({ data: { success: 1, message: "user Found", user: user, error: 0 } });
        }

    } catch (error) {
        console.log("Error during get user", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// user edit
const useredit = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request
        const userId = req.user;
        const { firstname, lastname, country_code, phone } = req.body;
        const newImage = req.body ? req.body.avatar : null;

        // Find the user by ID
        const user = await UserModel.findById(userId);

        if (!user) return res.json({ data: { success: 0, message: "User not found", error: 1 } });

        // Handle image updates
        let avatar = user.avatar;
        if (newImage && newImage !== user.avatar) {
            if (user.avatar) {
                // Delete the old image if it exists
                if (fs.existsSync(imagePath + user.avatar)) {
                    fs.unlinkSync(imagePath + user.avatar);
                }
            }
            avatar = newImage;
        }

        // update user details
        const updatedUser = await UserModel.findOneAndUpdate({ _id: userId }, { $set: { firstname, lastname, country_code, phone, avatar } }, { new: true });

        if (!updatedUser) {
            return res.json({ data: { success: 0, message: "Profile update failed", error: 1 } });
        }

        return res.json({ data: { success: 1, message: "Profile updated successfully", error: 0 } });

    } catch (error) {
        console.log("Error during user edit:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// upload image
const image = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request
        const avatar = req.file.filename;

        // Checking if the image file exists
        if (avatar) {

            return res.json({ data: { success: 1, message: "Image Uploaded Successfully", image: avatar, error: 0 } });
        }
        else {

            return res.json({ data: { success: 0, message: "Image Not uploaded", error: 1 } });
        }

    } catch (error) {
        console.log("Error during upload image:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// user delete account
const deleteaccount = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;

        // fetch user
        const user = await UserModel.findOne({ _id: userId })

        if (!user) {
            return res.json({ data: { success: 1, message: 'User Not Found !!', error: 0 } });
        }

        if (user.avatar) {
            // Delete the old image if it exists
            if (fs.existsSync(user.avatar)) {
                fs.unlinkSync(user.avatar);
            }
        }

        // favourite course
        await FavouriteModel.deleteMany({ userId: userId });

        // delete enrollment
        await EnrollModel.deleteMany({ userId: userId });

        // delete all read lesson
        await ReadModel.deleteMany({ userId: userId });

        // delete completed percentage
        await CompletedPercentageModel.deleteMany({ userId: userId });

        // delete assignment percentage
        await AssignmentPercentageModel.deleteMany({ userId: userId });

        // delete attempt assignment question
        await AttemptAssignmentModel.deleteMany({ userId: userId });

        // fetch certificets
        const certifcates = await CertificateModel.find({ userId: userId });

        // delete certificate image
        const data = certifcates.map((item) => {
            if (fs.existsSync(item.imagePath)) {
                fs.unlinkSync(item.imagePath);
            }
        })

        // delete certificate
        await CertificateModel.deleteMany({ userId: userId });

        // delete review 
        await ReviewModel.deleteMany({ userId: userId });

        // delete user chat
        await ChatModel.deleteMany({ userId: userId });

        // delete user device
        await userNotificationModel.deleteMany({ userId: userId });

        // delete user
        await UserModel.deleteOne({ _id: userId });

        return res.json({ data: { success: 1, message: 'Account Deleted Successfully', error: 0 } });

    } catch (error) {
        console.error("Error during delete user account", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get all intro
const intro = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        const intro = await IntroModel.aggregate([{ $match: (req.body) }]);


        if (!intro.length) {

            return res.json({ data: { success: 0, message: "Intro Not Found", intro: intro, error: 1 } });
        }
        else {

            return res.json({ data: { success: 1, message: "Intro Found", intro: intro, error: 0 } });
        }

    } catch (error) {
        console.log("Error during get all intro", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// slider
const slider = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        const slider = await SliderModel.find({ status: "Publish" }, { status: 0 }).populate('courseId', 'course ')

        if (!slider.length) {
            return res.json({ data: { success: 0, message: "Slider Not Found", slider: slider, error: 1 } });
        }

        return res.json({ data: { success: 1, message: "Slider Found", slider: slider, error: 0 } });

    } catch (error) {
        console.log("Error during slider", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// category
const category = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // fetch all category
        const category = await CategoryModel.find({ status: "Publish" }, { status: 0 });

        if (!category.length) {

            return res.json({ data: { success: 0, message: "Category Not Found", category: category, error: 1 } });
        }
        else {

            return res.json({ data: { success: 1, message: "Category Found", category: category, error: 0 } });
        }

    } catch (error) {
        console.log("Error during get all category", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// instructor
const instructor = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // fetch all instructor
        const instructor = await InstructorModel.aggregate([{ $match: (req.body) }])

        if (!instructor.length) return res.json({ data: { success: 0, message: "Instructor Not Found", instructor: instructor, error: 1 } });

        return res.json({ data: { success: 1, message: "Instructor Found", instructor: instructor, error: 0 } });

    } catch (error) {
        console.log("Error during instructor", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get all course
const course = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.body.userId || null;
        const courseId = req.body.courseId;
        const categoryId = req.body.categoryId;
        const instructorId = req.body.instructorId;
        const minPrice = req.body.min_price;
        const maxPrice = req.body.max_price;
        const search = req.body.search;

        let filters = {};

        if (courseId) {
            filters._id = courseId;
        }

        if (categoryId) {
            filters.categoryId = categoryId;
        }

        if (instructorId) {
            filters.instructorId = instructorId;
        }

        if (minPrice !== undefined && maxPrice !== undefined) {
            filters.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
        } else if (minPrice !== undefined) {
            filters.price = { $gte: parseInt(minPrice) };
        } else if (maxPrice !== undefined) {
            filters.price = { $lte: parseInt(maxPrice) };
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filters.$or = [
                { course: searchRegex }
            ];
        }

        // Add filter for courses with status "Publish"
        filters.status = "Publish";

        // fetch course
        const courses = await CourseModel.find(filters)
            .populate('categoryId', "avatar category").populate("instructorId", "instructor avatar degree speciality about");

        // combine courses review
        const updatedCoursesData = await combineCoursesReview(courses, userId);

        if (!updatedCoursesData.length) {

            return res.json({ data: { success: 0, message: 'Courses Not Found !!', coursedetails: updatedCoursesData, error: 1 } });

        } else {
            return res.json({ data: { success: 1, message: "Courses Found !!", coursedetails: updatedCoursesData, error: 0 } });
        }

    } catch (error) {
        console.error("Error fetching courses:", error);
        return res.json({ data: { success: 0, message: "An error occurred while fetching courses.", error: 1 } });
    }
}

// trending course
const trendingCourse = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        //    Extract data from the request body
        let userId = req.body.userId || null;

        // Aggregate enrollments to find the most popular courses
        const result = await EnrollModel.aggregate([
            {
                $group: {
                    _id: "$courseId",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // console.log("Aggregated enrollment result:", result);
        let courseDetails;
        if (!result.length) {

            courseDetails = await CourseModel.find({ status: "Publish" }).limit(7)
                .populate('categoryId', "avatar category")
                .populate("instructorId", "instructor avatar degree speciality about");
        }
        else {

            const courseInfo = result.map(item => ({ courseId: item._id, count: item.count }));
            courseInfo.sort((a, b) => b.count - a.count);

            const courseIds = courseInfo.map(item => item.courseId);

            courseDetails = await CourseModel.find({ _id: { $in: courseIds }, status: "Publish" }).limit(7)
                .populate('categoryId', "avatar category")
                .populate("instructorId", "instructor avatar degree speciality about");

            courseDetails.sort((a, b) => {
                const countA = result.find(item => item._id.toString() === a._id.toString()).count;
                const countB = result.find(item => item._id.toString() === b._id.toString()).count;
                return countB - countA;
            });
        }

        // combine courses review
        const updatedCoursesData = await combineCoursesReview(courseDetails, userId);

        if (!updatedCoursesData.length) {

            return res.json({ data: { success: 0, message: 'Courses Not Found !!', trendingCourses: updatedCoursesData, error: 1 } });

        } else {
            return res.json({ data: { success: 1, message: "Courses Found !!", trendingCourses: updatedCoursesData, error: 0 } });
        }

    } catch (error) {
        console.log("Error during trending course", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get lesson and topic
const lesson = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {
        // Extract data from the request body
        const { userId, courseId } = req.body;

        // Check for missing parameters
        if (!userId || !courseId) {
            return res.status(400).json({ data: { success: 0, message: "Missing userId or courseId.", error: 1 } });
        }

        // fetch course
        const course = await CourseModel.findOne({ _id: courseId })

        // If the course is not found,
        if (!course) return res.json({ data: { success: 0, message: "Course not found!", error: 1 } });

        // Find enrollment
        const enrollment = await EnrollModel.findOne({ userId, courseId });

        // Fetch lessons with topics
        const lessons = await Lessonmodel.aggregate([
            {
                $match: {
                    courseId: new mongoose.Types.ObjectId(courseId)
                }
            },
            {
                $lookup: {
                    from: "topics",
                    localField: "_id",
                    foreignField: "lessonId",
                    as: "topics"
                }
            },
            {
                $sort: {
                    'fieldName': 1
                }
            }
        ]);

        // If no lessons are found
        if (!lessons.length)
            return res.json({ data: { success: 0, message: "This course has no lessons available.", lessons, error: 1 } });

        // Process lessons based on enrollment status
        if (enrollment && enrollment.is_enroll === 1) {

            // User is enrolled, process lesson topics
            for (const lesson of lessons) {

                if (lesson.topics && lesson.topics.length > 0) {

                    const lessonTopicIds = lesson.topics.map(topic => topic._id);

                    // Fetch read topics for the user
                    const readTopics = await ReadModel.find({ userId, topicId: { $in: lessonTopicIds }, done: 1 });

                    // Update completion status of topics
                    lesson.topics.forEach(topic => {
                        topic.completed = readTopics.some(readTopic => readTopic.topicId.equals(topic._id));
                    });

                    // Check if all topics are completed
                    lesson.completed = lesson.topics.every(topic => topic.completed);
                } else {
                    // Handle lessons without topics
                    lesson.completed = false;
                }
            }
        } else {
            // User is not enrolled, hide sensitive info
            lessons.forEach(lesson => {
                if (lesson.topics && lesson.topics.length > 0) {
                    lesson.topics.forEach(topic => {
                        // Clear sensitive info
                        topic.allfile = "";
                        topic.upload_type = "";
                        topic.link = "";
                        topic.video = "";
                        topic.url = "";
                        topic.description = "";
                        topic.completed = false;
                    });
                }
            });
        }

        return res.json({ data: { success: 1, message: "Lessons found", lessons, error: 0 } });

    } catch (error) {
        console.error("Error during get lesson:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
};

// read lesson
const readlesson = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;
        const courseId = req.body.courseId;
        const lessonId = req.body.lessonId;
        const topicId = req.body.topicId;

        // Check for missing parameters
        if (!courseId || !lessonId || !topicId)
            return res.status(400).json({ data: { success: 0, message: "Missing required fields: courseId, lessonId, and/or topicId.", error: 1 } });

        // fetch topic
        const topic = await TopicModel.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(topicId),
                    lessonId: new mongoose.Types.ObjectId(lessonId)
                }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: 'lessonId',
                    foreignField: '_id',
                    as: 'lesson'
                }
            },
            {
                $unwind: '$lesson'
            },
            {
                $match: {
                    'lesson.courseId': new mongoose.Types.ObjectId(courseId)
                }
            }
        ]);

        // If the topic is not found,
        if (!topic.length) return res.json({ data: { success: 0, message: "Topic not found for the provided course and lesson.", error: 1 } });

        // Check if the topic has already been marked as read
        const existingRead = await ReadModel.findOne({ userId, courseId, lessonId, topicId })
            .populate('userId', 'username').populate('courseId', 'course').populate('lessonId', 'lesson').populate('topicId', 'topic');

        if (existingRead)
            return res.json({ data: { success: 0, message: "You are allready done this topic !!", error: 1 } });

        // Save the read status
        const addRead = await new ReadModel({ userId, courseId, lessonId, topicId }).save();

        // Retrieve all lessons for the course
        const allLessons = await Lessonmodel.find({ courseId: courseId });
        const lessonIds = allLessons.map(lesson => lesson._id);

        // Find all topics related to the lessons
        const totalTopics = await TopicModel.find({ lessonId: { $in: lessonIds } });

        // Find all completed topics for the user
        const readTopics = await ReadModel.find({ userId: userId, lessonId: { $in: lessonIds }, done: 1 });

        // Create a map of lesson IDs to their completed topic counts
        const lessonCompletedTopicsMap = {};
        totalTopics.forEach(topic => {
            if (!lessonCompletedTopicsMap[topic.lessonId]) {
                lessonCompletedTopicsMap[topic.lessonId] = { total: 0, completed: 0 };
            }
            lessonCompletedTopicsMap[topic.lessonId].total += 1;
        });

        // console.log("Lesson topic counts map:", lessonCompletedTopicsMap);

        readTopics.forEach(readTopic => {
            if (lessonCompletedTopicsMap[readTopic.lessonId]) {
                lessonCompletedTopicsMap[readTopic.lessonId].completed += 1;
            }
        });

        // console.log("Updated lesson topic counts map with completed topics:", lessonCompletedTopicsMap);

        // Update each lesson with its completion status
        await Promise.all(
            allLessons.map(async (lesson) => {
                const { total, completed } = lessonCompletedTopicsMap[lesson._id] || { total: 0, completed: 0 };
                const isCompleted = total > 0 && total === completed;

                // Update lesson's completion status
                await EnrollModel.updateOne(
                    { userId, courseId },
                    { $set: { is_completed: isCompleted } }
                );
            })
        );

        // Calculate and upsert the completion percentage for the user and course
        const completedTopicsCount = readTopics.length;
        const totalTopicsCount = totalTopics.length;
        const completedPercentage = ((completedTopicsCount * 100) / totalTopicsCount).toFixed(2);

        // Upsert the completed percentage for the user and course
        const updatedScore = await CompletedPercentageModel.findOneAndUpdate({ userId, courseId }, { $set: { completedPercentage } }, { upsert: true, new: true })
            .populate("courseId", "course");

        if (updatedScore.completedPercentage === 100) {
            // send notification
            const title = "Course Completed";
            const message = `Great job! You've successfully completed the ${updatedScore.courseId.course} course. Don't forget to submit your assignment to get your certificate!`;
            await sendUserNotification(updatedScore.userId, title, message);
        }

        return res.json({ data: { success: 1, message: "Great job! You've successfully completed read this topic.", error: 0 } });

    } catch (error) {
        console.error("Error during read lesson:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// Enroll a user in a course
const enroll = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;
        const { courseId, date, payment, paymentMode, transactionId, price } = req.body;

        // fetch course
        const course = await CourseModel.findOne({ _id: courseId }).populate(['categoryId', 'instructorId']);

        // If the course is not found,
        if (!course) return res.json({ data: { success: 0, message: "Course not found!", error: 1 } });

        // Check if the user has already enrolled in the course
        const existingEnrollment = await EnrollModel.findOne({ courseId: courseId, userId: userId })
            .populate('categoryId', "-status")
            .populate('instructorId');

        // If the user is already enrolled, return an error message
        if (existingEnrollment) {
            return res.json({ data: { success: 0, message: "You already bought this course!", enrollCourse: existingEnrollment, error: 1 } });
        }

        // save enroll course
        const newEnrollment = await EnrollModel.create(
            {
                courseId: courseId, userId: userId, date: date, payment: payment, paymentMode: paymentMode, transactionId: transactionId,
                categoryId: course.categoryId, instructorId: course.instructorId, price: price, is_enroll: 1
            });

        return res.json({ data: { success: 1, message: "Enrolled in the course successfully!", enrollCourse: newEnrollment, error: 0 } });

    } catch (error) {
        console.error("Error during course enrollment:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get user enroll course 
const mycourselist = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;
        // console.log("userId ==>", userId);

        // Fetch the list of courses the user is enrolled in
        const enrolledCourses = await EnrollModel.find({ userId: userId }).populate('courseId', 'name');

        // No enrolled courses found
        if (!enrolledCourses.length) return res.json({ data: { success: 0, message: "You are not enrolled in any courses.", mycourse: [], error: 1 } });

        // Fetch courses
        const courseIds = enrolledCourses.map(enrollment => enrollment.courseId._id);
        const courses = await CourseModel.find({ _id: { $in: courseIds } })
            .populate('categoryId', 'avatar category')
            .populate('instructorId', 'instructor avatar degree speciality about');


        // Fetch completion percentages for each course
        const courseData = await Promise.all(courses.map(async (course) => {
            const completedPercentageDoc = await CompletedPercentageModel.findOne({ userId, courseId: course._id });
            const completedPercentage = completedPercentageDoc ? completedPercentageDoc.completedPercentage : 0;
            return {
                course,
                is_buy: 1,
                completedPercentage
            };
        }));

        // Filter out courses with 100% completion
        const filteredCourseData = courseData.filter(item => item.completedPercentage < 100);

        // Check if all courses are completed
        const allCoursesCompleted = courseData.every(item => item.completedPercentage === 100);

        if (allCoursesCompleted) {
            return res.json({ data: { success: 0, message: "All your enrolled courses are completed. Displaying completed courses.", mycourse: [], error: 1 } });
        }

        return res.json({ data: { success: 1, message: "Successfully fetched your enrolled courses.", mycourse: filteredCourseData, error: 0 } });

    } catch (error) {
        console.error("Error during get my course list:", error);
        return res.json({ data: { success: 0, message: "An error occurred while processing your request.", error: 1 } });
    }
}

// completed course
const completedcourse = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;

        const courseResults = [];

        const mycourses = await EnrollModel.find({ userId: userId }).populate(['courseId', 'categoryId', 'instructorId']);

        // No enrolled courses found
        if (!mycourses.length)
            return res.json({ data: { success: 0, message: "You are not enrolled in any courses.", mycourse: [], error: 1 } });

        for (let mycourse of mycourses) {

            if (mycourse.is_enroll === 1) {

                if (mycourse.is_completed === 1) {

                    const courseId = mycourse.courseId;

                    // Find certificate and completion percentage documents
                    const GetCertificate = await CertificateModel.findOne({ userId: userId, courseId: courseId });

                    const completedPercentageDoc = await CompletedPercentageModel.findOne({ userId: userId, courseId: courseId });

                    // Default completed percentage to 0 if not found
                    const completedPercentage = completedPercentageDoc ? completedPercentageDoc.completedPercentage : 0;

                    if (completedPercentage === 100.00) {
                        const courseResult = {
                            courseId: {
                                ...courseId.toObject(),
                                is_buy: 1,
                                categoryId: mycourse.categoryId,
                                instructorId: mycourse.instructorId,
                            },
                            completedPercentage: completedPercentage,
                            is_Certified: mycourse.courseId.is_Certified ? true : false,
                            certificateTitle: GetCertificate ? GetCertificate.certificateTitle : null,
                            imagePath: GetCertificate ? GetCertificate.imagePath.replace(/\\/g, '/') : null
                        };

                        courseResults.push(courseResult);
                    }
                }
            }
        }

        if (!courseResults.length) {

            return res.json({ data: { success: 0, message: "You have not completed any courses.", mycourse: courseResults, error: 1 } });

        } else {

            return res.json({ data: { success: 1, message: "Completed courses and certificates fetched successfully.", mycourse: courseResults, error: 0 } });
        }

    } catch (error) {
        console.log("Error during for completed course", error.message);
        return res.json({ data: { success: 0, message: "An error occurred while processing your request.", error: 1 } });
    }
}

// Register Lora font
registerFont(path.join(__dirname, '../public/assets/vendor/fonts/Lora', 'Lora-Regular.ttf'), { family: 'Lora' });

// create certificate
const createCertificate = async (userId, courseId) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Fetch enrollment details
        const enrollment = await EnrollModel.findOne({ userId: userId }).populate('userId');

        if (!enrollment) {
            throw new Error('Enrollment not found');
        }

        // Fetch course details
        const course = await CourseModel.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }

        const { firstname, lastname } = enrollment.userId;
        const certificateTitle = `${firstname} ${lastname}`;
        const courseTitle = course.course;

        // Additional text to prepend before course name
        const additionalText = "Has Successfully Completed the Course:";
        const combinedText = `${additionalText} ${courseTitle}`;

        const timestamp = new Date().getTime();
        const imagePath = path.join(uploads, `${timestamp}_${certificateTitle}_certificate.jpg`).replace(/\s+/g, '_');;

        const canvas = createCanvas(1000, 700);
        const ctx = canvas.getContext('2d');

        const backgroundImage = await loadImage(uploads + '/123123123.jpg');
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        // Function to split text into multiple lines based on max width
        const getWrappedText = (text, maxWidth, ctx) => {
            const words = text.split(' ');
            let lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                let word = words[i];
                let width = ctx.measureText(currentLine + ' ' + word).width;
                if (width < maxWidth) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            return lines;
        };

        // Add user name
        ctx.font = '48px Lora';
        ctx.fillStyle = '#0B1320';
        ctx.textAlign = 'center';
        const textX = canvas.width / 2;
        ctx.fillText(certificateTitle, textX, 370);

        // Add additional text before course name
        ctx.font = '20px Lora';  // Adjust font and size as needed
        const maxTextWidth = 800;  // Maximum width for text before wrapping
        const wrappedText = getWrappedText(combinedText, maxTextWidth, ctx);

        // Draw each line of the wrapped text
        wrappedText.forEach((line, index) => {
            ctx.fillText(line, textX, 425 + (index * 25));  // Adjust position and line height as needed
        });

        const buffer = canvas.toBuffer('image/jpeg');
        fs.writeFileSync(imagePath, buffer);

        console.log(`Certificate generated and saved at: ${imagePath}`);

        const certificate = {
            certificateTitle,
            courseTitle, // Add course title to the certificate data
            imagePath,
            userId,
            courseId,
        };

        await CertificateModel.create(certificate);

        return {
            certificateTitle,
            courseTitle, // Return course title as part of the response
            imagePath,
            userId,
            courseId,
        };
    } catch (error) {
        console.error('Error generating certificate:', error);
        throw error;
    }
}

// get assignment
const getassignment = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;
        const courseId = req.body.courseId;

        // Find completed percentage
        const completedPercentage = await CompletedPercentageModel.findOne({ userId, courseId });

        // Check if course is fully completed
        if (completedPercentage && completedPercentage.completedPercentage < 100) {
            return res.json({ data: { success: 0, message: "You need to complete the course before accessing the assignment", error: 1 } });
        }

        // Find assignments
        const assignments = await AssignmentModel.find({ courseId });

        // Check if assignments are found
        if (!assignments.length) {
            return res.status(404).json({ data: { success: 0, message: "No assignments found", error: 1 } });
        }

        // Fetch total questions for each assignment
        const assignmentsWithQuestions = await Promise.all(assignments.map(async (assignment) => {
            const totalQuestions = await QuestionModel.countDocuments({ assignmentId: assignment._id });
            return { ...assignment.toObject(), totalQuestions };
        }));

        return res.json({ data: { success: 1, message: "Assignments retrieved successfully", assignments: assignmentsWithQuestions, error: 0 } });

    } catch (error) {
        console.error("Error during get assignment:", error);
        return res.json({ data: { success: 0, message: "An error occurred while processing your request.", error: 1 } });
    }
}

// get questions
const getQuestions = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;
        const courseId = req.body.courseId;
        const assignmentId = req.body.assignmentId;

        // Find completed percentage
        const completedPercentage = await CompletedPercentageModel.findOne({ userId, courseId });

        // Check if course is fully completed
        if (completedPercentage.completedPercentage < 100) {
            return res.status(403).json({ data: { success: 0, message: "You need to complete the course before accessing the assignment questions.", error: 1 } });
        }

        //find questions of assignments
        const findQuestions = await QuestionModel.find({ assignmentId: assignmentId });

        // check questions 
        if (!findQuestions.length) {
            return res.json({ data: { success: 0, message: "Questions not found", Questions: findQuestions, error: 1 } });
        }

        return res.json({ data: { success: 1, message: "Questions found successfully", Questions: findQuestions, error: 0 } });

    } catch (error) {
        console.error("Error during get assignment questions:", error);
        return res.json({ data: { success: 0, message: "An error occurred while processing your request.", error: 1 } });
    }
}

// assignment
const assignment = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request bosy
        const userId = req.user;
        const { courseId, assignmentId, quiz } = req.body;

        const assignment = await AssignmentModel.findOne({ _id: assignmentId, courseId: courseId }).populate("courseId");

        if (!assignment) return res.json({ data: { success: 0, message: "Assignment not found for the given course.", error: 1 } });

        // Fetch enrollment details
        const enrollment = await EnrollModel.findOne({ userId, courseId }).populate('userId').populate("courseId", "course");

        if (!enrollment) return res.json({ data: { success: 0, message: "You cannot submit the assignment because you are not enrolled in this course.", error: 1 } });

        // Fetch completed percentage for the user and course
        const completedPercentage = await CompletedPercentageModel.findOne({ userId, courseId })
        if (completedPercentage.completedPercentage < 100) {
            return res.status(403).json({ data: { success: 0, message: "Complete the course before solving this assignment.", error: 1 } });
        }

        // Check previous attempts
        const previousassignments = await AttemptAssignmentModel.findOneAndDelete({ userId, courseId, assignmentId }).populate('userId', 'firstname')
            .populate('courseId', 'course').populate('assignmentId', 'assignment').populate('quiz.questionId', 'correctOption');

        if (previousassignments) {
            // Calculate and update average assignment percentage
            const averagePercentage = await calculateAverageAssignmentPercentage(userId, courseId);
            await AssignmentPercentageModel.findOneAndUpdate({ userId, courseId }, { $set: { avg_assignment_percentage: averagePercentage } }, { new: true, upsert: true });
        }

        const results = [];
        let totalCorrectAnswers = 0;
        let totalWrongAnswers = 0;

        // Fetch all questions in parallel
        const questions = await QuestionModel.find({ _id: { $in: quiz.map(q => q.questionId) }, assignmentId });

        for (const que of quiz) {
            const question = questions.find(q => q._id.toString() === que.questionId);

            if (!question) {
                return res.json({ data: { success: 0, message: `No question with ID ${que.questionId} was found for the provided assignment.`, error: 1 } });
            }

            const is_correct = String(question.correctOption) === String(que.seletedOption) ? 1 : 0;
            if (is_correct) totalCorrectAnswers += 1;
            else totalWrongAnswers += 1;

            results.push({ questionId: que.questionId, seletedOption: que.seletedOption, is_correct });
        }

        // count total question
        const total_assignment_question = await QuestionModel.countDocuments({ assignmentId: assignmentId });
        const total_attempt_question = quiz.length;
        const score_percentage = ((totalCorrectAnswers / total_assignment_question) * 100).toFixed(2);

        // save attempt question
        const saveAttemptQuestion = await new AttemptAssignmentModel(
            {
                userId, courseId, assignmentId, quiz: results, total_assignment_question: total_assignment_question,
                total_correct_answer: totalCorrectAnswers, total_wrong_answer: totalWrongAnswers,
                total_attempt_question: total_attempt_question, score_percentage: score_percentage
            }
        ).save();

        if (score_percentage > 33) {

            // Calculate average assignment percentage for the user and course
            const averagePercentage = await calculateAverageAssignmentPercentage(userId, courseId);

            // Find or create AssignmentPercentage record and update avg assignment percentage
            const findAverage = await AssignmentPercentageModel.findOneAndUpdate(
                { userId, courseId },
                { $set: { avg_assignment_percentage: averagePercentage } },
                { new: true, upsert: true }
            )

            const assignmentPercentageLimit = parseInt(process.env.ASSIGNMENT_PERTANAGE, 10);
            // genreate certificate
            if (assignment.courseId.is_Certified && findAverage.avg_assignment_percentage >= assignmentPercentageLimit) {
                const findCertificate = await CertificateModel.findOne({ userId, courseId });
                if (!findCertificate) {
                    await createCertificate(userId, courseId);
                    // send notification
                    const title = "Get Your Certificate!";
                    const message = `Congratulations! You have completed the course ${enrollment.courseId.course} and are eligible to receive your certificate.`;
                    await sendUserNotification(enrollment.userId, title, message);

                }
            }
        }

        return res.json({ data: { success: 1, message: "You successfully attempted the question", error: 0 } });

    } catch (error) {
        console.error('Error processing attempt assignment question:', error);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// calculate avaerage assignment
const calculateAverageAssignmentPercentage = async (userId, courseId) => {

    try {

        // Fetch attempts for the user and course
        const attempts = await AttemptAssignmentModel.find({ userId, courseId });

        if (!attempts.length) return 0;

        // Calculate total percentage based on user attempts
        let total_score_percentage = 0;
        for (let attempt of attempts) {
            total_score_percentage += attempt.score_percentage;
        }
        // console.log("total_score_percentage ===>", total_score_percentage);

        // total assignment 
        const total_assignment = await AssignmentModel.countDocuments({ courseId });
        // console.log("total_assignment ==>", total_assignment);

        // Calculate the average assignment percentage
        const averagePercentage = (total_score_percentage / total_assignment).toFixed(2);

        // console.log(`Average Assignment Percentage for userId ${userId} and courseId ${courseId}: ${averagePercentage}%`);

        return parseFloat(averagePercentage);

    } catch (error) {
        console.error('Error calculating average assignment percentage:', error);
        return 0;
    }
}

// get result
const getresult = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;
        const courseId = req.body.courseId;
        const assignmentId = req.body.assignmentId;

        const readlesson = await AttemptAssignmentModel.findOne({ userId, courseId, assignmentId })
            .populate('quiz.questionId', 'text options correctOption')

        if (!readlesson) {
            return res.json({ data: { success: 0, message: "It looks like you haven't attempted this assignment yet. Please complete the assignment to see your results.", error: 1 } });
        }

        if (readlesson.score_percentage < 33) {

            // Delete the attempt with incorrect answers
            const deleteResult = await AttemptAssignmentModel.deleteOne({ userId, courseId, assignmentId });

            if (deleteResult.deletedCount > 0) {
                // Calculate average assignment percentage for the user and course
                const averagePercentage = await calculateAverageAssignmentPercentage(userId, courseId);

                // Update completedPercentage in AssignmentPercentageModel
                const findAverage = await AssignmentPercentageModel.findOneAndUpdate(
                    { userId, courseId },
                    { $set: { avg_assignment_percentage: averagePercentage } },
                    { new: true, upsert: true }
                );
            }

            return res.json({ data: { success: 0, message: `Your current score is ${readlesson.score_percentage}%. You need at least 33% to pass. Please retake the assignment to improve your score.`, error: 1 } });
        }

        return res.json({ data: { success: 1, message: "Here is Your Result !!", percentage: readlesson.score_percentage + "%", result: readlesson, error: 0 } });

    } catch (error) {
        console.error('Error processing get result:', error);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get assignment score
const getAssignmentScore = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;
        const courseId = req.body.courseId || null;

        // Find assignment percentage
        const findassignmentpercentage = await AssignmentPercentageModel.findOne({ userId, courseId });

        if (!findassignmentpercentage) {
            return res.json({ data: { success: 0, message: `Your assignment score is 0% because you have not attended any assignments.`, score: 0, error: 1 } });
        }

        const assignmentPercentageLimit = parseInt(process.env.ASSIGNMENT_PERTANAGE, 10);

        if (findassignmentpercentage && findassignmentpercentage.avg_assignment_percentage < assignmentPercentageLimit) {
            return res.json({ data: { success: 0, message: `Your assignment score is ${findassignmentpercentage.avg_assignment_percentage}%. To receive the certificate, you need to achieve a minimum score of ${assignmentPercentageLimit}.`, score: findassignmentpercentage.avg_assignment_percentage, error: 1 } });
        }

        return res.json({ data: { success: 1, message: `Your assignment score is ${findassignmentpercentage.avg_assignment_percentage}%. Congratulations, you have earned your certificate!`, score: findassignmentpercentage.avg_assignment_percentage, error: 0 } });

    } catch (error) {
        console.error('Error processing get avg assignment percentage:', error);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get certificate 
const getcertificate = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;
        const courseId = req.body.courseId;

        // fetch courser
        const course = await CourseModel.findOne({ _id: courseId, is_Certified: false });

        if (course) {
            return res.json({ data: { success: 0, message: "Sorry, this course does not offer a certificate.", getcertificate: [], error: 1 } });
        }

        // Find assignment percentage
        const findassignmentpercentage = await AssignmentPercentageModel.findOne({ userId, courseId });

        if (!findassignmentpercentage) {
            return res.json({ data: { success: 0, message: "You haven't completed any assignments for this course, so you cannot access the certificate.", getcertificate: [], error: 1 } });
        }

        const assignmentPercentageLimit = parseInt(process.env.ASSIGNMENT_PERTANAGE, 10);

        if (findassignmentpercentage && findassignmentpercentage.avg_assignment_percentage < assignmentPercentageLimit) {
            return res.json({ data: { success: 0, message: `Your assignment score is ${findassignmentpercentage.avg_assignment_percentage}. To receive the certificate, you need to achieve a minimum score of ${assignmentPercentageLimit}.`, getcertificate: [], error: 1 } });
        }
        // Check percentage
        if (findassignmentpercentage && findassignmentpercentage.avg_assignment_percentage >= assignmentPercentageLimit) {

            const getcertificate = await CertificateModel.find({ userId, courseId })
                .populate('courseId')
                .populate('userId', 'firstname lastname avatar email phone');

            if (!getcertificate.length) {
                return res.json({ data: { success: 0, message: "Certificate Not Found", getcertificate: [], error: 1 } });
            }

            // Replace backslashes with forward slashes in imagePath for each certificate
            const formattedCertificates = getcertificate.map(cert => {
                const certObj = cert.toObject();
                certObj.imagePath = certObj.imagePath.replace(/\\/g, '/');
                return certObj;
            });

            return res.json({ data: { success: 1, message: "Certificate Found", getcertificate: formattedCertificates, error: 0 } });
        }

    } catch (error) {
        console.error("Error retrieving certificate:", error);
        return res.json({ data: { success: 0, message: "Certificate Not Found !!", error: 1 } });
    }
}

// get certifcate list
const getcertificateList = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;

        // Fetch all certificates for the user
        const certificates = await CertificateModel.find({ userId })
            .populate({ path: 'courseId', select: 'course _id' });

        // Process certificates to include completedPercentage and fix imagePath
        const processedCertificates = await Promise.all(certificates.map(async (certificate) => {

            // Fetch assignment percentage data
            const assignmentPercentageData = await AssignmentPercentageModel.findOne({ userId: certificate.userId, courseId: certificate.courseId._id });

            const completedPercentage = assignmentPercentageData ? assignmentPercentageData.avg_assignment_percentage : 0;

            const certObj = {
                ...certificate.toObject(),
                completedPercentage
            };

            // Replace backslashes with forward slashes in the imagePath, if it exists
            if (certObj.imagePath) {
                certObj.imagePath = certObj.imagePath.replace(/\\/g, '/');
            }

            return certObj;
        }));

        // Check if there are any processed certificates
        if (processedCertificates.length > 0) {

            return res.json({ data: { success: 1, message: "Certificates found.", certificateList: processedCertificates, error: 0 } });

        } else {

            return res.json({ data: { success: 0, message: "No certificates found.", certificateList: [], error: 1 } });
        }

    } catch (error) {
        console.error("Error retrieving certificates:", error);
        return res.json({ data: { success: 0, message: "An error occurred while retrieving certificates.", error: 1 } });
    }
}

//  add favorite course
const favourite = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        //Extract data from the request body
        const userId = req.user;
        const courseId = req.body.courseId;

        const existingCourse = await FavouriteModel.findOne({ userId, courseId })

        if (!existingCourse) {

            // save favourite Course
            const newfavouriteCourse = await new FavouriteModel({ userId, courseId }).save();

            return res.json({ data: { success: 1, message: "Favorite Course added successfully", error: 0 } });

        } else {

            return res.json({ data: { success: 0, message: "Course is already a favorite for this user", error: 1 } });
        }

    } catch (error) {
        console.log("Error during add favourite course:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get favourite
const getfavourite = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extracting data from the request body
        const userId = req.user;

        // Fetch the favorite courses with nested population
        const favouriteCourses = await FavouriteModel.find({ userId });

        const favouriteCourseIds = favouriteCourses.map(fp => fp.courseId);

        // fetch course
        const courses = await CourseModel.find({ _id: { $in: favouriteCourseIds } })
            .populate('categoryId', "avatar category").populate("instructorId", "instructor avatar degree speciality about");

        // combine courses review
        const updatedCoursesData = await combineCoursesReview(courses, userId);

        if (!updatedCoursesData.length) return res.json({ data: { success: 0, message: 'Courses Not Found !!', favorite: updatedCoursesData, error: 1 } });

        return res.json({ data: { success: 1, message: "Courses Found !!", favorite: updatedCoursesData, error: 0 } });

    } catch (error) {
        return res.json({ data: { success: 0, message: 'Error Fetching Favourites !!', error: 1 } });
    }
};

// remove favourite course
const unfavourite = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        let userId = req.user
        let courseId = req.body.courseId

        // delete favourite course
        const unfavorite = await FavouriteModel.deleteOne({ userId: userId, courseId: courseId });

        if (unfavorite) {

            return res.json({ data: { success: 1, message: "course Unfavorite Successfully !!", error: 0 } });

        } else {

            return res.json({ data: { success: 0, message: 'No course Found !!', error: 1 } });
        }

    } catch (error) {
        return res.json({ data: { success: 0, message: 'Error Fetching !!', error: 1 } });
    }
}

// get currency
const getCurrency = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        let getCurrency = await Currency.findOne();

        if (getCurrency) {
            return res.json({ data: { success: 1, message: "currency found successfully!", currencydetails: getCurrency, error: 0 } });
        }

        return res.json({ data: { success: 0, message: 'currency not found !', currencydetails: getCurrency, error: 1 } });

    } catch (error) {
        return res.json({ data: { success: 0, message: "currency not found!", error: 1 } });
    }
}

// add review
const review = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;
        const courseId = req.body.courseId;
        const reviewText = req.body.review;
        const rating = req.body.rating;

        const existingReview = await ReviewModel.findOne({ courseId, userId }).populate('userId', 'firstname lastname avatar');

        if (existingReview) return res.json({ data: { success: 0, message: "You have already reviewed this course", review: existingReview, error: 1 } });

        const enroll = await EnrollModel.findOne({ userId, courseId: courseId, is_enroll: 1 });

        if (!enroll) return res.json({ data: { success: 0, message: "Please purchase the course before submitting a review.", error: 1 } });

        const newReview = await ReviewModel.create({ courseId, userId, review: reviewText, rating });

        return res.json({ data: { success: 1, message: "Review created successfully", review: newReview, error: 0 } });

    } catch (error) {
        console.log("Error during add review:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get all notification
const getAllNotification = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;

        const notiifcation = await notificationModel.find({ recipient_user: userId }, { is_read: 0, recipient_user: 0 });

        if (!notiifcation.length) {
            return res.json({ data: { success: 0, message: "Notification Not Found", notiifcation: notiifcation, error: 1 } });
        }

        return res.json({ data: { success: 1, message: "Notification Found", notiifcation: notiifcation, error: 0 } });

    } catch (error) {
        console.log("Error during get all notification:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get all payment gateway
const paymentmethod = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        let payment = await Payment.find();

        if (payment.length > 0) {

            const paymentData = payment.map(payment => ({

                "paypal": {
                    "paypal_is_enable": payment.paypal_is_enable,
                    "paypal_mode": payment.paypal_mode,
                    "paypal_merchant_Id": payment.paypal_mode == "testMode" ? payment.paypal_testmode_merchant_Id : payment.paypal_livemode_merchant_Id,
                    "paypal_tokenization_key": payment.paypal_mode == "testMode" ? payment.paypal_testmode_tokenization_key : payment.paypal_livemode_tokenization_key,
                    "paypal_public_key": payment.paypal_mode == "testMode" ? payment.paypal_testmode_public_key : payment.paypal_livemode_public_key,
                    "paypal_private_key": payment.paypal_mode == "testMode" ? payment.paypal_testmode_private_key : payment.paypal_livemode_private_key
                },
                "stripe": {
                    "stripe_is_enable": payment.stripe_is_enable,
                    "stripe_test_mode": payment.stripe_mode,
                    "stripe_publishable_key": payment.stripe_mode == "testMode" ? payment.stripe_testmode_publishable_key : payment.stripe_livemode_publishable_key,
                    "stripe_secret_key": payment.stripe_mode == "testMode" ? payment.stripe_testmode_secret_key : payment.stripe_livemode_secret_key
                },
                "razorpay": {
                    "razorpay_is_enable": payment.razorpay_is_enable,
                    "razorpay_mode": payment.razorpay_mode,
                    "razorpay_key_Id": payment.razorpay_mode == "testMode" ? payment.razorpay_testmode_key_Id : payment.razorpay_livemode_key_Id,
                    "razorpay_key_secret": payment.razorpay_mode == "testMode" ? payment.razorpay_testmode_key_secret : payment.razorpay_livemode_key_secret
                }

            }));

            return res.json({ data: { success: 1, message: "Payment Method found !!", paymentMethodDetails: paymentData, error: 0 } });
        }
        else {
            return res.json({ data: { success: 0, message: 'payment method not found', error: 1 } });
        }

    } catch (error) {
        return res.json({ data: { success: 0, message: 'payment method not found', error: 1 } });
    }
}

// get page
const getPage = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        const pages = await pageModel.findOne();

        if (!pages) {

            return res.json({ data: { success: 0, message: "Page Not Found", page: pages, error: 1 } });
        }
        else {
            return res.json({ data: { success: 1, message: "Page Found", page: pages, error: 0 } });
        }

    } catch (error) {
        console.log("Error during get page:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// user chat
const userchat = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        const { message } = req.body;
        const userId = req.user;

        const chat = await ChatModel.create({ sender: 'user', userId, message });

        if (chat) {

            await UserModel.findByIdAndUpdate(userId, { lastActivity: Date.now() });

            return res.json({ success: 1, message: "Chat Sent", chat, error: 0 });

        } else {
            return res.status(400).json({ success: 0, message: "Failed to send chat", error: 1 });
        }

    } catch (error) {
        console.log("Error during user chat:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

function parsePaginationParams(req) {
    const page = parseInt(req.body.page || req.query.page) || 1;
    const limit = parseInt(req.body.limit || req.query.limit) || 5;
    const skip = (page - 1) * limit;
    return { limit, skip, page };
}

// get all chat
const getallchat = async (req, res) => {


    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const userId = req.user;
        const { limit, skip, page } = parsePaginationParams(req);
        const { page: reqPage } = req.body;
        const hasUserId = !!userId;
        const hasPage = !!reqPage;
        const total = await ChatModel.countDocuments();
        const totalpages = Math.ceil(total / limit);

        let chat;

        if (hasUserId && hasPage) {
            chat = await ChatModel.find({ userId }).skip(skip).limit(limit);
        } else if (hasUserId) {
            chat = await ChatModel.find({ userId });
        } else if (hasPage) {
            chat = await ChatModel.find().skip(skip).limit(limit);
        } else {
            chat = await ChatModel.find(req.body).skip(skip).limit(limit);
        }
        // console.log("chat ==>", chat);
        if (chat.length > 0) {
            return res.json({ data: { success: 1, page, limit, totalpages, totalRecords: total, message: "User Chat Found", chats: chat, error: 0 } });
        } else {
            return res.json({ data: { success: 0, message: "Chat Not Found !!", chats: chat, error: 1 } });
        }

    } catch (error) {
        return res.json({ data: { success: 0, message: "Chat Not Found !!", error: 1 } });
    }
}

// get otp 
const getOtp = async (req, res) => {

    try {


        // Extract data from the request body
        const { email } = req.body;

        // Fetch OTP
        const otp = await OtpModel.findOne({ email });

        if (!otp) {
            return res.json({ data: { success: 0, message: "OTP not found", otp, error: 1 } });
        }

        return res.json({ data: { success: 1, message: "OTP found", otp, error: 0 } });

    } catch (error) {
        console.log("Error during get otp", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get forgot password otp
const getForgotPasswordOtp = async (req, res) => {

    try {

        // Extract data from the request body
        const { email } = req.body;

        // Fetch OTP
        const otp = await forgotPasswordOtpModel.findOne({ email });

        if (!otp) {
            return res.json({ data: { success: 0, message: "OTP not found", otp, error: 1 } });
        }

        return res.json({ data: { success: 1, message: "OTP found", otp, error: 0 } });

    } catch (error) {
        console.log("Error during get forgot password otp", error.message);
        return res.json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}


module.exports = {

    checkregisteruser,
    signup,
    verifyotp,
    signin,
    isVerifyAccount,
    resendOtp,
    forgotpassword,
    forgotPasswordVerification,
    resetPassword,
    changepassword,
    useredit,
    getuser,
    intro,
    slider,
    category,
    instructor,
    course,
    lesson,
    enroll,
    review,
    mycourselist,
    readlesson,
    assignment,
    getresult,
    getassignment,
    getQuestions,
    getAssignmentScore,
    getcertificate,
    getcertificateList,
    userchat,
    getallchat,
    favourite,
    getfavourite,
    unfavourite,
    image,
    getCurrency,
    trendingCourse,
    completedcourse,
    deleteaccount,
    paymentmethod,
    getPage,
    getAllNotification,
    getOtp,
    getForgotPasswordOtp,

}