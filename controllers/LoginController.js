const LoginModel = require('../models/LoginModel');
const SliderModel = require('../models/SliderModel');
const CategoryModel = require('../models/CategoryModel');
const InstructorModel = require('../models/InstructorModel');
const CourseModel = require('../models/CourseModel');
const LessonModel = require('../models/LessonModel');
const UserModel = require('../models/UserModel');
const EnrollModel = require('../models/EnrollModel');

const bcrypt = require('bcrypt');

const login = async (req, res) => {
    // login session
    if (req.session.userId) {
        res.redirect('  /dashboard');
    } else {
        res.render('login', { message: '' });
    }
};

const logindata = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const AdminData = await LoginModel.findOne({ email: email });

        if (AdminData) {
            const passMatch = await bcrypt.compare(password, AdminData.password);
            if (passMatch) {
                req.session.userId = AdminData._id;
                res.redirect('/dashboard');
            } else {
                res.render('login', { message: "Email and Passowrd not correct" });
            }
        } else {
            res.render('login', { message: "Email and Passowrd not correct" });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const dashboard = async (req, res) => {
    try {
        const slider = await SliderModel.find({});
        const category = await CategoryModel.find({});
        const instructor = await InstructorModel.find({});
        const course = await CourseModel.find({});
        const lesson = await LessonModel.find({});
        const user = await UserModel.find({});
        const enroll = await EnrollModel.find({});

        return res.render('dashboard', { slider: slider, category: category, instructor: instructor, course: course, lesson: lesson, users: user, enroll: enroll });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
    }
}

const logout = async (req, res) => {
    try {
        // Session destroy
        req.session.destroy((err) => {
            if (err) {
                console.error(err)
            } else {
                res.redirect('/');
            }
        });
    } catch (error) {
        console.error('Error fetching logout:', error);
    }
}


module.exports = {
    login,
    logindata,
    dashboard,
    logout
}