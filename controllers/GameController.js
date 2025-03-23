const GameModel = require('../models/GameModel');
const LoginModel = require('../models/LoginModel');

// Importing the service function to check if the user is verified
const { checkVerify, clearConfigData } = require("../services/getConfigstoreInstance");

// view for add game
const game = async (req, res) => {

    try {

        let gamedata = await GameModel.find({})

        return res.render('game', { gamedata: gamedata });

    } catch (error) {
        console.error('Error fetching game :', error);
    }
}

// add game

const gamedata = async (req, res) => {

    try {

        let loginData = await LoginModel.findOne({ _id: req.session.userId });

        if (loginData && loginData.is_admin === 0) {
            req.flash('error', 'You don\'t have permission to add game. As a demo admin, you can only view the content.');
            return res.redirect('/game');
        }

        const level = req.body.level;
        const words = req.body.words;

        // console.log(req.body)

        // save game
        await GameModel.create({ level, words })

        return res.redirect('/viewgame');

    } catch (error) {
        console.error('Error fetching category :', error);
    }
}

// view for all game
const viewgame = async (req, res) => {

    try {

        // check if the user is verified
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const currentUrl = protocol + '://' + req.get('host')
        const verifyData = await checkVerify(currentUrl);

        if (verifyData === 0) { clearConfigData(); }

        const viewgame = await GameModel.find();

        const loginData = await LoginModel.find({});

        return res.render('viewgame', { success: true, mygame: viewgame, loginData: loginData });

    } catch (error) {
        console.error('Error fetching game :', error);
    }
}

// delete game
const deletegame = async (req, res) => {

    try {

        const id = req.query.id;

        // Fetch the game details and populate related data
        const game = await GameModel.findById(id);

        if (!game) {
            req.flash('error', 'Game not found.');
            return res.redirect('/viewgame');
        }

        // delete the gameLevel
        await GameModel.findByIdAndDelete(id);

        // Redirect to the game view after deletion
        return res.redirect('/viewgame');

    } catch (error) {
        console.error('Error deleting game:', error);
        req.flash('error', 'An error occurred while deleting the game.');
        return res.redirect('/viewgame');
    }
}

// view for Edit game
const editgame = async (req, res) => {

    try {

        let id = req.query.id;

        const editgame = await GameModel.findById({ _id: id });

        return res.render('editgame', { editgame: editgame });

    } catch (error) {
        console.error('Error fetching game :', error);
    }
}

// update game
const updategame = async (req, res) => {

    try {

        let id = req.query.id;
        // console.log(req.body)
        // update game
        await GameModel.findByIdAndUpdate(id, { level: req.body.level, words: req.body.words });

        return res.redirect('/viewgame');

    } catch (error) {
        console.error('Error fetching game :', error);
    }
}

module.exports = {
    game,
    gamedata,
    viewgame,
    deletegame,
    editgame,
    updategame
}