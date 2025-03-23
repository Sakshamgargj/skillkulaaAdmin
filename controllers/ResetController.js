const LoginModel = require('../models/LoginModel');
const bcrypt = require('bcrypt');

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error);
    }
}

const resetpassword = async (req, res) => {
    try {
        const user = await LoginModel.findById(req.session.userId);
        if (!user) {
            console.log("User not found");
            return res.redirect("/");
        } else {
            return res.render('resetpassword', { myprofile: user });
        }
    } catch (error) {
        console.error('Error fetching resetpassword:', error);
    }
}

const resetdata = async (req, res) => {
    try {
        const oldpassword = req.body.oldpassword;
        const password = req.body.password;
        const confirmPassword = req.body.cpassword;

        const id = req.session.userId;
        const admin = await LoginModel.findById({ _id: id });

        console.log(admin.password);
        if (admin) {
            const passMatch = await bcrypt.compare(oldpassword, admin.password);
            console.log(passMatch);
            if (passMatch) {
                if (password == confirmPassword) {
                    const securePass = await securePassword(password);
                    await LoginModel.findByIdAndUpdate({ _id: id }, { $set: { password: securePass } });

                    return res.redirect('/dashboard');
                } else {
                    return res.render('resetpassword', { message: "Confirm password not matched" });
                }
            } else {
                return res.render('resetpassword', { message: "old password not matched" });
            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    resetpassword,
    resetdata
}