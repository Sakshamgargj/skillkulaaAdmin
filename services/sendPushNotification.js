// Importing required modules 
const admin = require('firebase-admin');
const moment = require("moment");

// important firebase project
// const serviceAccount = require("../firebase.json");
const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Fix newlines
    client_email: process.env.FIREBASE_CLIENT_EMAIL
};

// Importing models
const userNotificationModel = require("../models/userNotificationModel");
const notificationModel = require("../models/notificationModel");

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Function to send notification to a admin
async function sendAdminNotification(title, message) {

    try {

        // Save admin notification 
        await new notificationModel({ title, recipient_admin: "Admin", message }).save();

    } catch (error) {
        console.error("Error sending admin notification:", error);
    }
}

// Function to send notification to a user 
async function sendUserNotification(userId, title, message) {

    try {

        // Fetch user tokens
        const userTokens = await userNotificationModel.findOne({ userId: userId });

        if (userTokens) {

            // Save notification to database
            await new notificationModel({ recipient_user: userId, title, message }).save();

            // Retrieve registration token for the user
            const registrationToken = userTokens.registrationToken;

            // Send push notification
            await sendPushNotification(registrationToken, title, message);
        }

    } catch (error) {

        console.error("Error sending user notification:", error);
        return false;
    }
}

// send notification one device
async function sendPushNotification(registrationToken, title, message) {

    const messages = {
        notification: {
            title: title,
            body: message
        },
        token: registrationToken
    };

    try {

        // Send the message to single devices
        const response = await admin.messaging().send(messages);

        console.log('Notification sent successfully:', response);

        // // Check for failures and log detailed errors
        // response.responses.forEach((resp, index) => {
        //     if (!resp.success) {
        //         console.error(`Failed to send notification to token ${registrationTokens[index]}:`, resp.error);
        //     }
        // });

    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// send notiifcations multiple device
async function sendMultipleNotifications(registrationTokens, title, message) {

    const promises = registrationTokens.map(token => {
        
        const messagePayload = {
            notification: {
                title: title,
                body: message,
            },
            token: token,
        };

        return admin.messaging().send(messagePayload);
    });

    try {
        // Send all notifications and wait for them to complete
        const responses = await Promise.all(promises);

        console.log('Notifications sent successfully:', responses);

        // Log failures
        responses.forEach((resp, index) => {
            if (!resp.success) {
                console.error(`Failed to send notification to token ${registrationTokens[index]}:`, resp.error);
            }
        });

    } catch (error) {
        console.error('Error sending notifications:', error);
    }
}


module.exports = { sendPushNotification, sendMultipleNotifications, sendAdminNotification, sendUserNotification };
