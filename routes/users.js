const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// User model
const User = require('../models/user');

router.get("/login", (req, res) => res.render("login"));
router.get("/register", (req, res) => res.render("register"));
router.get("/registerfaculty", (req, res) => res.render("registerfaculty"));

// Forgot Password page

router.get('/forgot', (req, res)=>{
    res.render('forgot.ejs');
});

router.post('/forgot', (req, res, next)=>{
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({email: req.body.email}, function(err, user) {
                if(!user){
                    console.log('No user exists!');
                    return res.redirect('/users/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err){
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'mihirkumar02@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'mihirkumar02@gmail.com',
                subject: 'Educafe Password Reset',
                text: 'You are receiving this email because you (or someone else) have requested a password reset. Please click the following link or paste it in your browser to complete the process.' + 'http://' + req.headers.host + '/users/reset' + token + '\n\n' + 'Ignore this email, If this was not you, your password will remain unchanged.'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log('Mail sent');
                done(err, 'done');
            });
        }
    ], function(err){
        if(err){
            console.log(err);
        } else {
            res.redirect('/users/forgot');
        }
    });
});



// Register Handling

router.post('/register', function(req, res){
    const { regno, fname, lname, email, password, password2, code, contact, website, about, interests, city, country, role } = req.body;
    let errors = [];

    // Check required fields

    if (!regno || !fname || !lname || !email || !password || !password2 || !contact) {
        errors.push({ msg: 'Please fill all fields '});
    }

    // For faculties, check if access code matches
    
    if( role === 'Faculty'){
        if(code != 'edu123cafe'){
            errors.push({ msg: 'Incorrect Access Code!' });
        }
    }
    

    // Check passwords match

    if(password != password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    // Check password length
    if(password.length < 6){
        errors.push({msg: 'Password should be atleast 6 characters'});
    }

    if(contact.length != 10){
        errors.push({msg: 'Contact number should be 10 digits long'});
    }

    if(regno.length < 5 || regno.length > 9){
        errors.push({msg: 'Register number format incorrect!'});
    }

    if(errors.length > 0) {
        if(role === 'Faculty'){
            res.render('registerfaculty', { errors, regno, fname, lname, email, password, password2, code, contact, website, about, interests, city, country, role});
        } else {
            res.render('register', { errors, regno, fname, lname, email, password, password2, contact, website, about, interests, city, country, role});
        }
    } else { 
        // Validation passed, now...
        User.findOne({ email: email })
            .then(user => {
                if(user) {
                    errors.push({ msg: 'Email is already registered '});
                    //User exists
                    res.render('register', { errors, regno, fname, lname, email, password, password2, code, contact, website, about, interests, city, country, role});
                } else {
                    var upperRegNo = regno.toUpperCase();
                    const newUser = new User({
                        regno: upperRegNo, fname: fname, lname: lname, email: email, password: password, contact: contact, website: website, about: about, interests: interests, city: city, country: country, role: role
                    });

                    // Hash password
                    bcrypt.genSalt(10, (err, salt) => 
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if(err) throw err;

                            // Set password to hashed
                            newUser.password = hash;
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'You are now registered and can log in.');
                                    res.redirect('/users/login');
                                })
                                .catch(err => console.log(err));
                    }));
                }
            });
    }
});


// Edit email / password route
router.put('/edit/:id', (req, res) =>{
    var { currentpassword, email, password } = req.body;
    
    // IF NO VALUES PROVIDED (with or without currentPassword), NO CHANGES ARE MADE! 
    if((email == '' && password == '' && currentpassword == '') || (email == '' && password == '')){
        console.log('No changes made!');
        res.redirect('/profile/' + req.params.id);
    } else {

    // IF CURRENT PASSWORD NOT PROVIDED, Can't change account details!
    if(currentpassword == ''){
        console.log('Current password must be provided!');
        res.redirect('/profile/' + req.params.id);
    } else {
        // Match password 
        bcrypt.compare(currentpassword, req.user.password, (err, isMatch)=>{
            if(err) throw err;
                // Check if current password is entered correctly..
                if(!isMatch) {
                    console.log('Incorrect current password!');
                    res.redirect('/profile/' + req.params.id);
                } else {
                    if(email == ''){
                    // Update ONLY Password
                    // Hash password
                    bcrypt.genSalt(10, (err, salt) => 
                    bcrypt.hash(password, salt, (err, hash) => {
                    if(err) throw err;
                    // Set password to hashed
                    password = hash;
                    const updatedAccount = { password: password };
                    User.findByIdAndUpdate(req.params.id, updatedAccount, (err) =>{
                        if(err){
                            console.log(err);
                            res.redirect('back');
                        } else {
                            console.log('Try logging in with the new password!');
                            res.redirect('/profile/' + req.params.id);
                        }
                    }); 
                    }));
                    } else {
                        // Update ONLY E-mail
                        const updatedAccount = { email: email };
                        User.findByIdAndUpdate(req.params.id, updatedAccount, (err) =>{
                            if(err){
                                console.log(err);
                                res.redirect('back');
                            } else {
                                console.log('Try logging in with the new E-mail address!');
                                res.redirect('/profile/' + req.params.id);
                            }
                        });
                    }
                }
            });
        }
    }
});

// Login handling
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        successFlash: 'Welcome!',
        failureFlash: true
    })(req, res, next);
});

// Logout handling
router.get('/logout', (req, res)=>{
    req.logout();
    req.flash('success_msg', 'You are logged out!');
    res.redirect('/users/login');
});

module.exports = router;