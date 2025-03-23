const LoginModel = require("../models/LoginModel");
const UserModel = require("../models/UserModel");

require('dotenv').config()
const jwt = require('jsonwebtoken');


const isLogin = async (req, res, next) => {

    try {

        if (req.session.userId) {

            const admin = await LoginModel.findById({ _id: req.session.userId });

            if (!admin) {

                throw new Error('Admin not found');
            }

            res.locals.user = admin;
            
            next();
        }
        else {
            return res.redirect('/');
        }

    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req, res, next) => {

    try {

        if (req.session.userId) {
            return res.redirect('/dashboard');
        }

        next();

    } catch (error) {
        console.log(error.message);
    }

}

const isAuth = async (req, res, next) => {
    if (req.headers && req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        // console.log(token);
        
        try {
            const decode = jwt.verify(token, process.env.SESSION);
            console.log(decode.id);
            const user = await UserModel.findById(decode.id);
            console.log(user);

            if (!user) {
                return res.json({ success: false, message: 'unauthorized access! 1' });
            }

            req.user = user;
            next();

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.json({ success: false, message: 'Already Logout !!' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.json({ success: false, message: 'sesson expired try sign in!' });
            }
            res.json({ success: false, message: 'Internal server error!' });
        }
    } else {
        res.json({ success: false, message: 'unauthorized access! 3' });
    }
};

const isAuth1 = async (req, res, next) => {
    
    if (req.headers && req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        // console.log(token);
        
        try {
            const decode = jwt.verify(token, process.env.SESSION);
            console.log(decode.id);
            const user = await LoginModel.findById(decode.id);
            console.log(user);

            if (!user) {
                return res.json({ success: false, message: 'unauthorized access! 1' });
            }

            req.user = user;
            next();

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.json({ success: false, message: 'Already Logout !!' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.json({ success: false, message: 'sesson expired try sign in!' });
            }
            res.json({ success: false, message: 'Internal server error!' });
        }
    } else {
        res.json({ success: false, message: 'unauthorized access! 3' });
    }
};

module.exports = {
    isLogin,
    isLogout,
    isAuth,
    isAuth1
}