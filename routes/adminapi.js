const express = require('express');
const passport = require('passport')
const passportJwt = require('../config/passport');
const jwt = require('jsonwebtoken');
const routes = express.Router();

const AdminAPIController = require('../controllers/AdminAPIController.js');

// Importing middleware functions for check user authentication
const { checkAuthenticationForAdmin } = require("../middleware/checkAuthentication");

// singin
routes.post('/login', AdminAPIController.login);

routes.post('/alluser', checkAuthenticationForAdmin, AdminAPIController.alluser);

// user-admin chat 
routes.post('/adminchat', checkAuthenticationForAdmin, AdminAPIController.adminchat);

routes.post('/getallchat', checkAuthenticationForAdmin, AdminAPIController.getallchat);

routes.post('/searchchat', checkAuthenticationForAdmin, AdminAPIController.searchchat);

module.exports = routes;