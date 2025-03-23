// Importing required modules 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
require('dotenv').config();

// Importing models
const LoginModel = require('../models/LoginModel');
const UserModel = require('../models/UserModel');
const ChatModel = require('../models/ChatModel');
const verificationModel = require('../models/verificationModel');

// admin login
const login = async (req, res) => {

    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const email = req.body.email;
        const password = req.body.password;

        const verifydata = await LoginModel.findOne({ email: email });
        // console.log(verifydata);

        if (!verifydata) return res.json({ data: { success: 0, message: "User not found !!", error: 1 } });

        const passwordmatch = await bcrypt.compare(password, verifydata.password);

        if (!passwordmatch) return res.json({ data: { success: 0, message: "Email and Password is incorrect", error: 1 } });

        // Generate token
        const token = jwt.sign({ id: verifydata._id }, process.env.JWT_SECRET_KEY);

        return res.json({ data: { success: 1, message: "Successfully Logged User !!", token: token, error: 0 } })

    } catch (error) {
        return res.json({ data: { success: 0, message: "Admin not found !!", error: 1 } });
    }
}

// get all user
const alluser = async (req, res) => {

  
    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        const users = await UserModel.aggregate([
            {
                $lookup: {
                    from: "chats",
                    localField: "_id",
                    foreignField: "userId",
                    as: "chats",
                },
            },
            {
                $match: {
                    "chats": { $exists: true, $ne: [] },
                },
            },
            {
                $project: {
                    chats: 0
                },
            },
            {
                $sort: { updatedAt: -1 },
            },
        ]);

        if (users.length > 0) {
            return res.json({ data: { success: 1, message: "Users with chats found", users, error: 0 } });
        } else {
            return res.json({ data: { success: 0, message: "No users with chats found", error: 1 } });
        }

    } catch (error) {
        return res.json({ data: { success: 0, message: "An error occurred while fetching users.", error: 1 } });
    }
};

// admin chat
const adminchat = async (req, res) => {

  
    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    const io = req.app.get('io');
    try {

        // Extract data from the request body
        const { message, userId } = req.body;

        const chat = await ChatModel.create({ userId, message, is_admin: true });
        // console.log(chat);

        if (chat) {

            await UserModel.findByIdAndUpdate(userId, { lastActivity: Date.now() });

            io.to(userId).emit('newMessage', chat);

            return res.json({ success: 1, message: "message successfully send", chat, error: 0 });

        } else {
            return res.status(400).json({ success: 0, message: "Failed to send chat", error: 1 });
        }

    } catch (error) {
        console.log("Error during  admin chat:", error.message);
        return res.status(500).json({ data: { success: 0, message: "An error occurred", error: 1 } });
    }
}

// get all chat
const getallchat = async (req, res) => {

  
    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        // Extract data from the request body
        const { limit, skip, page } = parsePaginationParams(req);
        const { userId, page: reqPage } = req.body;
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

        if (chat.length > 0) {
            return res.json({ data: { success: 1, page, limit, totalpages, totalRecords: total, message: "Chat Found", chats: chat, error: 0 } });
        } else {
            return res.json({ data: { success: 0, message: "Chat Not Found !!", error: 1 } });
        }

    } catch (error) {
        return res.json({ data: { success: 0, message: "Chat Not Found !!", error: 1 } });
    }
}

function parsePaginationParams(req) {

    const page = parseInt(req.body.page || req.query.page) || 1;
    const limit = parseInt(req.body.limit || req.query.limit) || 5;
    const skip = (page - 1) * limit;
    return { limit, skip, page };

}

// search chat
const searchchat = async (req, res) => {

  
    const data = await verificationModel.findOne({});

    if (!data) {
        return res.json({ data: { success: 2, message: "Access denied. Verification required.", error: 1 } });
    }

    try {

        const search = req.body.search;
        const searchRegex = new RegExp(search, 'i');
        const chat = await ChatModel.find({ message: searchRegex });

        if (chat.length > 0) {

            return res.json({ data: { success: 1, message: "Chat Found", chats: chat, error: 0 } });

        } else {
            return res.json({ data: { success: 0, message: "Chat Not Found", error: 1 } });
        }

    } catch (error) {
        return res.json({ data: { success: 0, message: "Chat Not Found !!", error: 1 } });
    }
}


module.exports = {
    login,
    alluser,
    adminchat,
    getallchat,
    searchchat,
}