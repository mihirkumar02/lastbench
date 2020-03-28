const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Friend = require('../models/friend');

const { ensureAuthenticated } = require('../config/auth');

// Show my friends and friend requests
router.get('/:id', ensureAuthenticated, (req, res) => {
    User.findById(req.params.id, (err, user) => {
        if(err){
            console.log(err);
        } else {
            Friend.find({},(err, requests)=>{
                if(err){
                    console.log(err);
                } else {
                    // Add my friends
                    const myFriends = [];
                    requests.forEach((request) =>{
                        if(request.accepted && !user._id.equals(request.sender.id)){
                            myFriends.push(request);
                        }
                    });
                    // Add non-accepted requests
                    const nonAccepted = [];
                    requests.forEach(function(request){
                        if(!request.accepted && user._id.equals(request.receiver.id)){
                            nonAccepted.push(request);
                        } 
                    }); 
                    res.render('friends/all', {user: req.user, friends: myFriends, requests: nonAccepted});     
                }
            });
        }
    });
});


// Check later
// New available friends list
router.get('/:id/new', ensureAuthenticated, (req, res) =>{
    User.find({}, (err, users) => {
        if(err){
            console.log(err);
        } else {
            Friend.find({}, (err, requests) => {
                if(err){
                    console.log(err);
                } else {
                    const showUsers = [];
                    const availableRequests = [];
                    users.forEach(function(user){
                        requests.forEach(function(request){
                            if(!req.user._id.equals(request.sender.id) && !user._id.equals(request.receiver.id)){
                                showUsers.push(user);
                                availableRequests.push(request);
                            }
                        });
                    });
                    res.render('friends/add', {user: req.user, students: users, });
                }
            })
        }
    });
    /*User.findById(req.params.id, (err, user)=>{
        if(err){
            console.log(err);
        } else {
            Friend.find({}, (err, allRequests)=>{
                if(err){
                    console.log(err);
                } else {
                    const reallyAvailable = [];
                    allRequests.forEach(function(request){
                       if(!user._id.equals(request.sender.id)){

                       } 
                    });
                }
            });
            const students = [];
            users.forEach(function(oneuser){
                if(oneuser.role === 'Student' && !req.user.friends.includes(oneuser._id) && !oneuser._id.equals(req.user._id)){
                    students.push(oneuser);
                }
            });
            res.render('friends/add', {user: req.user, students: students});
        }
    });*/
});

// Send friend request
router.post('/:id/request/:rec_id', (req, res) =>{
    User.findById(req.params.rec_id, (err, receiver) =>{
        if(err){
            console.log(err);
        } else {
            User.findById(req.params.id, (err, sender) =>{
                if(err){
                    console.log(err);
                } else {
                    // add new friendship in friends model
                    const newRequest = new Friend({
                        sender: {
                            id: sender._id,
                            fname: sender.fname,
                            lname: sender.lname,
                            website: sender.website,
                            city: sender.city,
                            country: sender.country,
                            userImage: sender.userImage,
                        },
                        receiver: {
                            id: receiver._id,
                            fname: receiver.fname,
                            lname: receiver.lname,
                            website: receiver.website,
                            city: receiver.city,
                            country: receiver.country,
                            userImage: receiver.userImage
                        },
                        accepted: false
                    });

                    newRequest.save();  
                    console.log("Request sent!");
                    res.redirect('/friends/' + req.params.id + '/new');

                }
            });
        }
    });
});

// Accept friend requests
router.post('/:id/accept/:req_id', (req, res)=>{
    User.findById(req.params.id, (err, receiver)=>{
        if(err){
            console.log(err);
        } else {
            const updatedRequest = {accepted: true};
            Friend.findByIdAndUpdate(req.params.req_id, updatedRequest, (err, request)=>{
                if(err){
                    console.log(err); 
                } else {
                console.log("You are friends now!");
                res.redirect('/friends/' + req.params.id);
                }
            });
        }
    })
});

module.exports = router;