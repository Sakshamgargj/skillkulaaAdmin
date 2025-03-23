const UserModel = require('../models/UserModel');
const LoginModel = require('../models/LoginModel');
const EnrollModel = require('../models/EnrollModel');
const AssignmentPercentageModel = require('../models/AssignmentPercentageModel');
const AttemptAssignmentModel = require('../models/AttemptAssignmentModel');
const CertificateModel = require('../models/CertificateModel');
const CompletedPercentageModel = require('../models/CompletedPercentageModel');
const FavouriteModel = require('../models/FavouriteModel');
const ReadModel = require('../models/ReadModel');
const ReviewModel = require('../models/ReviewModel');

const fs = require('fs');

// Importing the service function to check if the user is verified
const { checkVerify} = require("../services/getConfigstoreInstance");

const viewuser = async (req, res) => {

    try {

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host')
        const verifyData = await checkVerify(currentUrl);

        const viewuser = await UserModel.find({});
        
        let loginData = await LoginModel.find({});

        if (viewuser) {
            return res.render('viewuser', { success: true, myuser: viewuser, loginData: loginData });
        } else {
            return res.render('viewuser', { success: false });
        }
    } catch (error) {
        console.error('Error fetching event :', error);
    }
}

const useractivation = async (req, res) => {
    const { id } = req.params;

    try {

        let loginData = await LoginModel.findOne({ _id: req.session.userId });

        if (loginData && loginData.is_admin === 0) {
            req.flash('error', 'You don\'t have permission to activate/deactivate users. As a demo admin, you can only view the content.');
            return res.redirect('/viewuser');
        }

        // Extract data from the request
        const id = req.query.id;

        // Find current images
        const currentUser = await UserModel.findById({ _id: id });

        await UserModel.findByIdAndUpdate({ _id: id }, { $set: { active: currentUser.active === false ? true : false } }, { new: true });

        // Redirect after successful activation/deactivation
        return res.redirect('/viewuser');

    } catch (err) {
        console.error('Error fetching or updating user:', err);
        return res.sendStatus(500);  // Send a server error status code
    }
};


// deelete user
const deleteuser = async (req, res) => {

    try {

        let id = req.query.id;

        // fetch user
        const user = await UserModel.findOne({ _id: id })

        if (!user) {
            req.flash("error", "User Not Found");
            return res.redirect('/viewuser');
        }

        if (user.avatar) {
            // Delete the old image if it exists
            if (fs.existsSync(user.avatar)) {
                fs.unlinkSync(user.avatar);
            }
        }

        // favourite course
        await FavouriteModel.deleteMany({ userId: user._id });

        // delete enrollment
        await EnrollModel.deleteMany({ userId: user._id });

        // delete all read lesson
        await ReadModel.deleteMany({ userId: user._id });

        // delete completed percentage
        await CompletedPercentageModel.deleteMany({ userId: user._id });

        // delete assignment percentage
        await AssignmentPercentageModel.deleteMany({ userId: user._id });

        // delete attempt assignment question
        await AttemptAssignmentModel.deleteMany({ userId: user._id });

        // fetch certificets
        const certifcates = await CertificateModel.find({ userId: user._id });

        // delete certificate image
        const data = certifcates.map((item) => {
            if (fs.existsSync(item.imagePath)) {
                fs.unlinkSync(item.imagePath);
            }
        })

        // delete certificate
        await CertificateModel.deleteMany({ userId: user._id });

        // delete review 
        await ReviewModel.deleteMany({ userId: user._id });

        await UserModel.deleteOne({ userId: user._id });

        return res.redirect('/viewuser');

    } catch (error) {
        console.error('Error fetching user :', error);
    }
}

module.exports = {
    viewuser,
    useractivation,
    deleteuser
}