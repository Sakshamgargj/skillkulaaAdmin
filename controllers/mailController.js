// Importing required modules 

// Importing models
const loginModel = require("../models/LoginModel");
const mailModel = require("../models/mailModel");

// Load and render the mail view
const loadMailConfig = async (req, res) => {

    try {

        const mailData = await mailModel.findOne();

        return res.render("mailConfig", { mailData });

    } catch (error) {
        console.log(error.message);
    }
}

//edit mail config
const mailConfig = async (req, res) => {

    try {

        const loginData = await loginModel.findById(req.session.userId);

        if (loginData && loginData.is_admin === 1) {

            // Extract data from the request
            const id = req.body.id;
            const host = req.body.host;
            const port = req.body.port;
            const mail_username = req.body.mail_username;
            const mail_password = req.body.mail_password;
            const encryption = req.body.encryption;
            const senderEmail = req.body.senderEmail;

            let result;

            if (id) {

                result = await mailModel.findByIdAndUpdate(id, { host, port, mail_username, mail_password, encryption, senderEmail }, { new: true });

            } else {

                result = await mailModel.create({ host, port, mail_username, mail_password, encryption, senderEmail });
            }

            if (result) {

                req.flash("success", id ? "Mail configuration updated successfully." : "Mail configuration added successfully.");
                return res.redirect('/mail-config');

            } else {

                req.flash("error", "Operation failed. Try again later.");
                return res.redirect('/mail-config');
            }

        }
        else {

            req.flash('error', 'You have no access to edit mail config, Only admin have access to this functionality...!!');
            return res.redirect('/mail-config');
        }

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadMailConfig,
    mailConfig
}
