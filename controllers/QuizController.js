// Importing models
const LoginModel = require('../models/LoginModel');
const AssignmentModel = require('../models/AssignmentModel');
const QuestionModel = require('../models/QuestionModel.js');

// view for add question/answer
const quiz = async (req, res) => {

    try {

        let assignmentId = req.query.id

        // fetch assignment
        let assignment = await AssignmentModel.findById({ _id: assignmentId })

        return res.render('quiz', { assignment: assignment });

    } catch (error) {
        console.error('Error fetching quiz :', error);
    }
}

// add question/answer
const quizdata = async (req, res) => {

    try {

        const id = req.query.id
        const { text, optionA, optionB, optionC, optionD, correctOption } = req.body;

        if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
            req.flash('error', 'Please select any option.');
            return res.redirect(`/quiz?id=${id}`);
        }

        const newQuestion = new QuestionModel({
            assignmentId: id,
            text,
            options: [optionA, optionB, optionC, optionD],
            correctOption,
        });

        await newQuestion.save();

        return res.redirect(`/viewquiz?id=${id}`);

    } catch (error) {
        console.error('Error adding quiz question:', error);
    }
}

// view for all question
const viewquiz = async (req, res) => {

    try {

        let id = req.query.id

        const viewquiz = await QuestionModel.find({ assignmentId: id }).populate('assignmentId')

        const assignment = await AssignmentModel.findById({ _id: id }).populate("courseId","course")

        const loginData = await LoginModel.find({});

        return res.render('viewquiz', { myquiz: viewquiz, assignment: assignment, loginData: loginData });

    } catch (error) {
        console.error('Error fetching assignment :', error);
    }
}

// delete questiob
const deletequiz = async (req, res) => {

    try {

        let id = req.query.id;

        const deletequiz = await QuestionModel.findByIdAndDelete(id);

        return res.redirect(`/viewquiz?id=${deletequiz.assignmentId}`);

    } catch (error) {
        console.error('Error fetching topic :', error);
    }
}

// view for edit question
const editquiz = async (req, res) => {

    try {

        let id = req.query.id;

        const editquiz = await QuestionModel.findById({ _id: id }).populate("assignmentId");

        return res.render('editquiz', { editquiz: editquiz });

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

// edit question
const updatequiz = async (req, res) => {

    try {

        let id = req.query.id;
        const { text, optionA, optionB, optionC, optionD, correctOption } = req.body;

        let upadtequestion = await QuestionModel.findByIdAndUpdate(id, { text, options: [optionA, optionB, optionC, optionD], correctOption });

        return res.redirect(`/viewquiz?id=${upadtequestion.assignmentId}`);

    } catch (error) {
        console.error('Error fetching lesson :', error);
    }
}

module.exports = {
    quiz,
    quizdata,
    viewquiz,
    deletequiz,
    editquiz,
    updatequiz
}