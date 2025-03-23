// Importing required modules

// Importing models
const ChatModel = require('../models/ChatModel');
const UserModel = require('../models/UserModel');
const LoginModel = require('../models/LoginModel');

const loadChat = async (req, res) => {

    try {

        const users = await UserModel.find({ active: true });

        return res.render("chat", { users });

    } catch (error) {
        console.log(error.message);

    }
}

const getUserList = async (req, res) => {

    try {

        // fetch all users
        const users = await UserModel.find({ active: true });

        return res.json(users);

    } catch (error) {
        console.log(error.message);
    }
}

// get user messages
const getUserMessages = async (req, res) => {

    try {

        const { userId } = req.query;

        // get admin id
        const adminId = req.session.userId;

        // Fetch messages between the current user and the selected user
        const messages = await ChatModel.find({ userId }).sort({ timestamp: 1 });

        // Format messages and include sender avatar based on whether sender is admin or user
        const formattedMessages = await Promise.all(messages.map(async (message) => {
            if (message.is_admin) {
                // Admin case: Fetch admin details
                const admin = await LoginModel.findOne({ is_admin: 1 });
                return {
                    _id: message._id,
                    senderId: admin._id,
                    receiverId: message.userId,
                    content: message.message,
                    senderAvatar: admin.avatar,
                    senderName: admin.name,
                    isAdmin: true,
                    timestamp: message.createdAt
                };
            } else {
                // Regular user case: Fetch user details
                const user = await UserModel.findOne({ _id: userId });
                return {
                    _id: message._id,
                    senderId: message.userId,
                    receiverId: adminId,
                    content: message.message,
                    senderAvatar: user.avatar,
                    senderName: user.firstname + " " + user.lastname,
                    isAdmin: false,
                    timestamp: message.createdAt
                };
            }
        }));

        res.json(formattedMessages);

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    loadChat,
    getUserList,
    getUserMessages
}