const ChatModel = require("../../../models/ChatModel");
const UserModel = require("../../../models/UserModel");
const LoginModel = require("../../../models/LoginModel");

module.exports = (io) => {

    let adminSocket = null;
    let adminActiveUserId = null;

    io.on('connection', (socket) => {
        // console.log('Admin connected:', socket.id);

        // Handle user authentication and add them to a room
        socket.on('authenticate', (userId) => {
            socket.userId = userId;
            socket.join(userId);  // Join a room with userId as the name
            // console.log(`User ${userId} authenticated and connected`);
        });

        // Handle admin authentication
        socket.on('admin-authenticate', () => {
            adminSocket = socket;
            // console.log('Admin authenticated and connected');
        });

        // Handle admin selecting a user
        socket.on('admin-select-user', (userId) => {
            adminActiveUserId = userId;
            // console.log(`Admin selected user: ${userId}`);
        });

        // Handle messages from admin to user
        socket.on('admin-send-message', async (data) => {
            const { content, userId, adminId } = data;

            const user = await UserModel.findOne({ _id: userId });
            const admin = await LoginModel.findOne({ _id: adminId, is_admin: 1 });

            const message = {
                content: content,
                senderId: admin._id,
                receiverId: user._id,
                timestamp: new Date(),
                isAdmin: true,
                senderAvatar: admin.avatar,
                senderName: admin.name
            };

            // Store the message in ChatModel
            const chatMessage = new ChatModel({ userId: user._id, message: content, is_admin: true, is_admin_read: true });
            await chatMessage.save();

            io.to(userId).emit('receive-message', message);  // Send message to user's room
            socket.emit('message-sent', message);  // Send back to admin

            // Send updated last message time to admin
            const lastMessageTime = chatMessage.createdAt;
            socket.emit('update-last-message-time', { userId, lastMessageTime });
        });

        // Handle messages from user to admin
        socket.on('user-send-message', async (data) => {
            const { content, userId } = data;
            // console.log("data ===>",data);
            const user = await UserModel.findOne({ _id: userId });
            const admin = await LoginModel.findOne({ is_admin: 1 });

            const message = {
                content: content,
                senderId: user._id,
                receiverId: admin._id,
                timestamp: new Date(),
                isAdmin: false,
                senderAvatar: user.avatar,
                senderName: user.firstname + " " + user.lastname,
            };

            const chatMessage = new ChatModel({
                userId: user._id,
                message: content,
                is_admin: false,
                is_admin_read: userId === adminActiveUserId  // Mark as read if admin has this user's chat open
            });
            await chatMessage.save();

            if (adminSocket) {
                adminSocket.emit('new-message', message);

                // Get updated unread count only if admin doesn't have this user's chat open
                if (userId !== adminActiveUserId) {
                    const unreadCount = await ChatModel.countDocuments({
                        userId: user._id,
                        is_admin: false,
                        is_admin_read: false
                    });
                    adminSocket.emit('update-unread-count', { userId, count: unreadCount });
                }
            }

            // Send confirmation to the user
            socket.emit('message-sent', message);
        });

        // Add this new event handler
        socket.on('get-unread-message-counts', async () => {
            try {
                const usersWithLastMessage = await ChatModel.aggregate([
                    {
                        $group: {
                            _id: '$userId',
                            lastMessageTime: { $max: '$createdAt' },
                            unreadCount: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $eq: ['$is_admin', false] },
                                                { $eq: ['$is_admin_read', false] }
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ]);

                const result = usersWithLastMessage.reduce((acc, curr) => {
                    acc[curr._id] = {
                        unreadCount: curr.unreadCount,
                        lastMessageTime: curr.lastMessageTime
                    };
                    return acc;
                }, {});

                socket.emit('unread-message-counts-and-times', result);
            } catch (error) {
                console.error('Error fetching unread message counts and times:', error);
            }
        });

        // Mark messages as read
        socket.on('mark-messages-read', async (userId) => {
            try {
                await ChatModel.updateMany(
                    { userId: userId, is_admin: false, is_admin_read: false },
                    { $set: { is_admin_read: true } }
                );

                const unreadCount = await ChatModel.countDocuments({
                    userId: userId,
                    is_admin: false,
                    is_admin_read: false
                });

                const lastMessage = await ChatModel.findOne({ userId: userId })
                    .sort({ createdAt: -1 })
                    .limit(1);

                const lastMessageTime = lastMessage ? lastMessage.createdAt : null;

                if (adminSocket) {
                    adminSocket.emit('update-unread-count', { userId, count: unreadCount, lastMessageTime });
                }
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Admin disconnected:', socket.id);
            if (socket.userId) {
                console.log(`User ${socket.userId} disconnected`);
            }
        });

    });
};
