const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Message = require('../models/message');
const { ensureAuthenticated } = require('../config/auth');


// Get the form for sending message
router.get('/:id', ensureAuthenticated, (req, res)=>{
    User.findById(req.params.id, (err, student) =>{
        if(err){
            console.log(err);
        } else {
            res.render('courses/messagestudent',{ user: req.user, student: student });
        }
    });
});


// Send the message and store to DB
router.post('/:id', ensureAuthenticated, (req, res) => {
    User.findById(req.params.id, (err, student) => {
        if(err){
            console.log(err); 
        } else {
            const { sender, message } = req.body;
            const newMessage = new Message({
                sender: {
                    id: req.user._id,
                    name: sender
                },
                receiver: {
                    id: student._id,
                    regno: student.regno,
                    name: student.fname + " " + student.lname
                },
                message: message
            });
            newMessage.save((err, newmsg) => {
                if(err){
                    res.redirect('/studentmessages/' + req.params.id);
                } else {
                    console.log('Message sent!');
                    res.redirect('/studentmessages/' + req.params.id);
                }
            });
        }
    });
});


// View the messages at student side
router.get('/:id/all', ensureAuthenticated, (req, res) => {
    User.findById(req.params.id, (err, student) =>{
        if(err){
            console.log(err);
        } else {
            Message.find({}, (err, allMessages)=>{
                if(err){
                    console.log(err);
                } else {
                    const studentMessages = [];
                    allMessages.forEach(function(message){
                        if(student._id.equals(message.receiver.id)){
                            studentMessages.push(message);
                        }
                    });
                    res.render('courses/allmessages', { student: student, messages: studentMessages, user: req.user });
                }
            });
        }
    });
});

module.exports = router;