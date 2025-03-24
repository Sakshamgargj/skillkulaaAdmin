// Importing required modules 
const express = require("express");
const path = require('path');
const multer = require('multer');

// Create an instance of the express router
const routes = express.Router();

// Importing middleware functions for admin authentication
const { isLogin, isLogout } = require("../middleware/auth");

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

// Importing middleware function to uploaded  multiple file
const multiplefile = require("../middleware/uploadMultipleFile");

// Import controllers
const LoginController = require('../controllers/LoginController');
const ResetController = require('../controllers/ResetController');
const ProfileController = require('../controllers/ProfileController');
const IntroController = require('../controllers/IntroController');
const CategoryController = require('../controllers/CategoryController');
const InstructorController = require('../controllers/InstructorController');
const SliderController = require('../controllers/SliderController');
const CourseController = require('../controllers/CourseController');
const LessonsController = require('../controllers/LessonsController');
const TopicController = require('../controllers/TopicController');
const UserController = require('../controllers/UserController');
const EnrollController = require('../controllers/EnrollController');
const CurrencyController = require('../controllers/currencyController');
const CertificateController = require('../controllers/CertificateController');
const AssignmentController = require('../controllers/AssignmentController');
const GameController = require('../controllers/GameController');
const QuizController = require('../controllers/QuizController');
const chatController = require('../controllers/chatController');
const reviewController = require("../controllers/reviewController");
const PaymentMethodController = require('../controllers/paymentMethodController');
const pageController = require("../controllers/pageController");
const mailController = require("../controllers/mailController");
const verificationController = require("../controllers/verificationController");

// Login
routes.get('/', isLogout, LoginController.login);

routes.get('/login', isLogout, LoginController.login);

routes.post('/login', uploadfile.single('avatar'), LoginController.logindata);

// Dashboard
routes.get('/dashboard', isLogin, LoginController.dashboard);

// Logout
routes.get('/logout', isLogin, LoginController.logout);

// reset-password
routes.get('/resetpassword', isLogin, ResetController.resetpassword);
routes.post('/resetpassword', ResetController.resetdata);

// Profile
routes.get('/profile', isLogin, ProfileController.profile);
routes.post('/profile', uploadfile.single('avatar'), ProfileController.profiledata);

// Slider
routes.get('/slider', isLogin, SliderController.slider);
routes.post('/slider', uploadfile.single('avatar'), SliderController.sliderdata);
routes.get('/viewslider', isLogin, SliderController.loadSilder);
routes.get('/deleteslider', SliderController.deleteslider);
routes.get('/editslider', isLogin, SliderController.editslider);
routes.post('/editslider', uploadfile.single('avatar'), SliderController.updateslider);
routes.get("/silder-status", isLogin, SliderController.updateSilderStatus);

// Introduction
routes.get('/intro', isLogin, IntroController.intro);
routes.post('/intro', uploadfile.single('avatar'), IntroController.introdata);
routes.get('/viewintro', isLogin, IntroController.viewintro);
routes.get('/deleteintro', IntroController.deleteintro);
routes.get('/editintro', isLogin, IntroController.editintro);
routes.post('/editintro', uploadfile.single('avatar'), IntroController.updateintro);

// Category
routes.get('/category', isLogin, CategoryController.category);
routes.post('/category', uploadfile.single('avatar'), CategoryController.categorydata);
routes.get('/viewCategory', isLogin, CategoryController.viewcategory);
routes.get('/deletecategory', CategoryController.deletecategory);
routes.get('/editcategory', isLogin, CategoryController.editcategory);
routes.post('/editcategory', uploadfile.single('avatar'), CategoryController.updatecategory);
routes.get("/category-status", isLogin, CategoryController.updateCategoryStatus);

// Instructor
routes.get('/instructor', isLogin, InstructorController.instructor);
routes.post('/instructor', uploadfile.single('avatar'), InstructorController.instructordata);
routes.get('/viewinstructor', isLogin, InstructorController.viewinstructor);
routes.get('/deleteinstructor', InstructorController.deleteinstructor);
routes.get('/editinstructor', isLogin, InstructorController.editinstructor);
routes.post('/editinstructor', uploadfile.single('avatar'), InstructorController.updateinstructor);

// Course
routes.get('/course', isLogin, CourseController.course);
routes.post('/course', uploadfile.single('avatar'), CourseController.coursedata);
routes.get('/viewcourse', isLogin, CourseController.viewcourse);
routes.get('/deletecourse', CourseController.deletecourse);
routes.get('/editcourse', isLogin, CourseController.editcourse);
routes.post('/editcourse', uploadfile.single('avatar'), CourseController.updatecourse);
routes.post('/certified/:id/toggle', CourseController.certified);
routes.post('/secure/:id/toggle', CourseController.secure);
routes.get("/course-status", isLogin, CourseController.updateCourseStatus);

// Lessons
routes.get('/lesson', isLogin, LessonsController.lesson);
routes.post('/lesson', uploadfile.single('avatar'), LessonsController.lessondata);
routes.get('/viewlesson', isLogin, LessonsController.viewlesson);
routes.get('/deletelesson', LessonsController.deletelesson);
routes.get('/editlesson', isLogin, LessonsController.editlesson);
routes.post('/editlesson', uploadfile.single('avatar'), LessonsController.updatelesson);

// Topics
routes.get('/topics', isLogin, TopicController.topics);
routes.post('/topics', multiplefile, TopicController.topicsdata);
routes.get('/viewtopics', isLogin, TopicController.viewtopics);
routes.get('/deletetopic', TopicController.deletetopic);
routes.get('/edittopic', isLogin, TopicController.edittopic);
routes.post('/edittopic', multiplefile, TopicController.updatetopic);

// Assignment
routes.get('/assignment', isLogin, AssignmentController.assignment);
routes.post('/assignment', AssignmentController.assignmentdata);
routes.get('/viewassignment', isLogin, AssignmentController.viewassignment);
routes.get('/deleteassignment', AssignmentController.deleteassignment);
routes.get('/editassignment', isLogin, AssignmentController.editassignment);
routes.post('/editassignment', AssignmentController.updateassignment);

// Game
routes.get('/game', isLogin, GameController.game);
routes.post('/game', GameController.gamedata);
routes.get('/viewgame', isLogin, GameController.viewgame);
routes.get('/deletegame', GameController.deletegame);
routes.get('/editgame', isLogin, GameController.editgame);
routes.post('/editgame', GameController.updategame);

// Quiz
routes.get('/quiz', isLogin, QuizController.quiz);
routes.post('/quiz', QuizController.quizdata);
routes.get('/viewquiz', isLogin, QuizController.viewquiz);
routes.get('/deletequiz', QuizController.deletequiz);
routes.get('/editquiz', isLogin, QuizController.editquiz);
routes.post('/editquiz', QuizController.updatequiz);

// User List
routes.get('/viewuser', isLogin, UserController.viewuser);
routes.post('/useractivation', UserController.useractivation);
routes.get('/deleteuser', UserController.deleteuser);

// certificate
// routes.get('/addcertificate', isLogin, CertificateController.certificate);
routes.get('/generate-certificate', CertificateController.generateCertificate);
// routes.post('/addCertificate', CertificateController.addCertificate);

// Enroll course
routes.get('/viewenroll', isLogin, EnrollController.viewenroll);
routes.get('/editenroll', isLogin, EnrollController.editbooking);
routes.post('/editenroll', EnrollController.updatebooking);

// Routes For Chat
routes.get('/chat', isLogin, chatController.loadChat);

routes.get('/get-user-list', isLogin, chatController.getUserList);

routes.get('/get-user-messages', isLogin, chatController.getUserMessages);

// Routes For Review
routes.get("/review", isLogin, reviewController.loadReview);

routes.post("/publish-review", reviewController.isPublishReview)

//currency
routes.get('/currency', isLogin, CurrencyController.currency);

routes.post('/currency', CurrencyController.currencydata);

// Payment Method
routes.get('/payment-method', isLogin, PaymentMethodController.loadPayment);

routes.post('/payment-method', PaymentMethodController.addPaymentMethod);

// Routes For Pages
routes.get("/private-policy", isLogin, pageController.loadPrivatePolicy);

routes.post("/add-private-policy", pageController.addPrivatePolicy);

routes.get("/terms-and-condition", isLogin, pageController.loadTermsAndCondition);

routes.post("/add-terms-and-condition", pageController.addTermsAndCondition);

routes.get("/about-us", isLogin, pageController.loadAboutUs);

routes.post("/add-about-us", pageController.addAboutUs);

// Routes For Verification
routes.get("/verification", isLogin, verificationController.loadVerification);

routes.post("/verify-key", verificationController.verifyKey);

routes.post("/revoke-key", verificationController.revokeKey);

// Routes For Mail Config
routes.get("/mail-config", isLogin, mailController.loadMailConfig);

routes.post("/mail-config", mailController.mailConfig);

routes.get('*', function (req, res) {
    res.redirect('/');
})

module.exports = routes;