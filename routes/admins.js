const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Course = require('../models/course');
const { isAdmin, ensureAuthenticated } = require('../config/auth');

// ADMIN ROUTES

// Get admin dashboard /admin/dashboard

router.get('/dashboard', isAdmin, (req, res) => {
    User.find({}, (err, foundUsers) => {
        if(err) {
            console.log(err);
        } else {
            res.render('admin/dashboard', {users: foundUsers, user: req.user });
        }
    });
});

router.delete('/dashboard/:id', isAdmin, (req, res) => {
    User.findByIdAndRemove(req.params.id, (err) => {
        if(err){
            res.redirect('/dashboard/' + req.params.id);
        } else {
            console.log('User has been removed successfully!');
            res.redirect('/admin/dashboard');
        }
    });
});

// ==== COURSES ====

// OPTION TO VIEW ALL COURSES // To add course id in routes
router.get('/courses', ensureAuthenticated, (req, res) => {
    Course.find({}, (err, foundCourses) => {
        if(err){
            console.log(err);
        } else {
            res.render('courses/all', {courses: foundCourses, user: req.user });
        }
    });
});

// OPTION TO ADD NEW COURSES
router.get('/courses/new', isAdmin, (req, res) => {
    res.render('courses/new', {user: req.user});
});

router.post('/courses', isAdmin, (req, res) => {
    const { code, name } = req.body;
    const newCourse = new Course({
        code: code, name: name
    });
    newCourse.save()
        .then(course => {
            req.flash('success_msg', 'New course added!');
            res.redirect('/admin/courses');
        })  
        .catch(err => console.log(err));
});

module.exports = router;