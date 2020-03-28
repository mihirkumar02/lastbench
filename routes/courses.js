const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const CourseFile = require('../models/uploadFile');
const CoursePost = require('../models/coursepost');
const { ensureAuthenticated, coursePostOwned } = require('../config/auth');


// Files upload
// Set Storage Engine
const storage = multer.diskStorage({
    destination: './public/files/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize Upload
const upload = multer({
    storage: storage,
    limits: {fileSize: 10000000000},
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('uploadFile');

// Check file type
function checkFileType(file, cb){
    const filetypes = /doc|DOC|docx|DOCX|txt|TXT|pdf|PDF|ppt|PPT/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb('Error: doc, docx, pdf, ppt, txt format only!');
    }
}


//POST upload
// Set Storage Engine
const courseStorage = multer.diskStorage({
    destination: './public/course/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize Upload
const courseUpload = multer({
    storage: courseStorage,
    limits: {fileSize: 10000000000},
    fileFilter: function(req, file, cb){
        checkPostType(file, cb);
    }
}).single('courseimage');

// Check file type
function checkPostType(file, cb){
    const filetypes = /jpeg|JPEG|jpg|JPG|png|PNG|gif|GIF|webp|WEBP/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb('Error: Images only!');
    }
}


// =========================================
// GET details for one course
router.get('/:course_id/details', ensureAuthenticated, (req, res) => {
    Course.findById(req.params.course_id, (err, foundCourse) => {
        if(err) {
            console.log(err); 
        } else {
            res.render('courses/details', { user: req.user, course: foundCourse});
        }
    });
});

// FACULTY REG FOR COURSE
router.post('/:course_id/details', ensureAuthenticated, (req, res) => {
    const registeredFaculty = {teaching: true, faculty: {id: req.user._id, username: req.user.fname + " " + req.user.lname, contact: req.user.contact}};
    Course.findByIdAndUpdate(req.params.course_id, registeredFaculty, (err) => {
        if(err){
            res.redirect('/courses/' + req.params.course_id + '/details');
        } else {
            User.findById(req.user._id, (err, user) => {
                if(err){
                    console.log(err);
                } else {
                    Course.findById(req.params.course_id, (err, course) => {
                        if(err){
                            console.log(err);
                        } else {
                            user.courses.push(course.code);
                            user.save();
                        }
                    });
                    console.log('Faculty registered!');
                    res.redirect('/courses/' + req.params.course_id + '/details');
                }
            });
        }
    });
});

// STUDENT REG FOR COURSE
router.post('/:course_id/enrolled', ensureAuthenticated, (req, res) => {
    const enrolledStudent = { regno: req.user.regno, username: req.user.fname + " " + req.user.lname, email: req.user.email, contact: req.user.contact };
    Course.findById(req.params.course_id, (err, course) =>{
        if(err){
            res.redirect('/courses/' + req.params.course_id + '/details');
        } else {
            course.students.push(enrolledStudent);
            course.save();
            User.findById(req.user._id, (err, user) => {
                if(err){
                    console.log(err);
                } else {
                    user.courses.push(course.code);
                    user.save();
                }
            });
            console.log('Enrolled for course!');
            res.redirect('/courses/' + req.params.course_id + '/' + req.user._id);
        }
    });
});

// COURSE PAGE FOR particular user and particular course, and showing all posts
router.get('/:course_id/:id', ensureAuthenticated, (req, res) => {
    Course.findById(req.params.course_id, (err, foundCourse) =>{
        if(err){
            console.log(err);
        } else {
            CoursePost.find({}, (err, foundPosts) => {
                if(err){
                    console.log(err);
                } else { 
                    const showPosts = [];
                    foundPosts.forEach(function(post){
                        if(foundCourse.code === post.code){
                            showPosts.push(post);
                        }
                    });
                    CourseFile.find({}, (err, foundFiles) => {
                        if(err){
                            console.log(err);
                        } else {
                            const showFiles = [];
                            foundFiles.forEach(function(file){
                                if(foundCourse.code === file.code){
                                    showFiles.push(file);
                                }
                            });
                            res.render('courses/coursepage', { user: req.user, course: foundCourse, posts: showPosts, files: showFiles });
                        }
                    });
                }
            });
        }
    });
});

// VIEW MY COURSES
router.get('/:id', (req, res) => {
    User.findById(req.params.id, (err, user) => {
       if(err){
           console.log(err);
       } else {
           Course.find({}, (err, allCourses) => {
               if(err){
                   console.log(err);
               } else {
                   const myCourses = [];
                   allCourses.forEach(function(course){
                       if(user.courses.includes(course.code)){
                           myCourses.push(course);
                       }
                   });
                   res.render('courses/my', { user: req.user, courses: myCourses });    
               }
           });
       }
   });
}); 


// To render new post form 
router.get('/:course_id/:id/new', ensureAuthenticated, (req, res) => {
    Course.findById(req.params.course_id, (err, course) => {
        if(err){
            console.log(err);
        } else {
            res.render('courses/newpost', { user: req.user, course: course });
        }
    });
});

// To add new post and send to faculty for verification
router.post('/:course_id/:id', ensureAuthenticated, (req, res) => {
    courseUpload(req, res, (err) =>{
        if(err){
            console.log('Failed to upload');
            res.render('/courses/' + req.params.course_id + '/' + req.params.id);
        } else {
            if(req.file === undefined){
                res.render('/courses/' + req.params.course_id + '/' + req.params.id);
            } else {
                console.log(req.file);
                Course.findById(req.params.course_id, (err, course) => {
                    if(err){
                        console.log(err);
                    } else {
                        const { title, description } = req.body;
                        const author = {
                            id: req.user._id,
                            regno: req.user.regno,
                            username: req.user.fname
                        }
                        const newCoursePost = new CoursePost({
                            code: course.code, verified: false, title: title, description: description, image: req.file.filename, author: author 
                        });
                        newCoursePost.save()
                            .then(post => {
                                req.flash('success_msg', 'Sent to faculty for verification!');
                                res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
                            })
                            .catch(err => console.log(err));
                    }
                });
            }
        }
    });
});



// Show approve posts page for faculty
router.get('/:course_id/:id/pending', ensureAuthenticated, (req, res) =>{ 
    Course.findById(req.params.course_id, (err, foundCourse) => {
        if(err){
            console.log(err);
        } else {
            CoursePost.find({}, (err, foundPosts) => {
                if(err) throw err;
                else {
                    const showPosts = [];
                    foundPosts.forEach(function(post){
                        if((foundCourse.code === post.code) && (!post.verified)){
                            showPosts.push(post);
                        }
                    });
                    res.render('courses/verifypost', { user: req.user, posts: showPosts, course: foundCourse });
                }
            });
        }
    });
});

// ============================
// Verified by faculty
// ============================

router.post('/:course_id/:id/verified/:post_id', ensureAuthenticated, (req, res) => {
    Course.findById(req.params.course_id, (err, foundCourse) => {
        if(err){
            console.log(err);
        } else {
            const verifiedPost = { verified: true };
            CoursePost.findByIdAndUpdate(req.params.post_id, verifiedPost, (err) => {
                if(err){
                    res.redirect('/courses/' + req.params.course_id + '/' + req.params.id + '/pending');
                } else {
                    res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
                }
            });
        }
    });
});


router.delete('/:course_id/:id/:post_id', ensureAuthenticated, (req, res) =>{
    CoursePost.findByIdAndDelete(req.params.post_id, (err) =>{
        if(err){
            console.log(err);
        } else {
            console.log('Post not approved and hence deleted!');
            res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
        }
    });
});



// Faculty adding new posts in course page
router.post('/:course_id/:id/faculty', ensureAuthenticated, (req, res) => {
    courseUpload(req, res, (err) =>{
        if(err){
            console.log('Failed to upload');
            res.render('/courses/' + req.params.course_id + '/' + req.params.id);
        } else {
            if(req.file === undefined){
                res.render('/courses/' + req.params.course_id + '/' + req.params.id);
            } else {
                console.log(req.file);
        Course.findById(req.params.course_id, (err, course) => {
            if(err){
                console.log(err);
            } else {
                const { title, description } = req.body;
                const author = {
                    id: req.user._id,
                    username: req.user.fname
                }
                const newCoursePost = new CoursePost({
                    code: course.code, verified: true, title: title, description: description, image: req.file.filename,    author: author 
                });
                newCoursePost.save()
                    .then(post => {
                        req.flash('success_msg', 'Post added!');
                        res.redirect('/courses/' + req.params.course_id +   '/' + req.params.id);
                    })
                    .catch(err => console.log(err));
                }
            });
        }
    }
    });
});


// ====================================
// === EDIT and DELETE Course Posts ===
// ====================================


// Get edit form
router.get('/:course_id/:id/:post_id/edit', coursePostOwned, (req, res) => {
    Course.findById(req.params.course_id, (err, foundCourse) => {
        if(err) {
            console.log(err);
        } else {
            CoursePost.findById(req.params.post_id, (err, foundPost) => {
                if(err){
                    console.log(err);
                } else {
                    res.render('courses/edit', { user: req.user, post: foundPost, course: foundCourse });
                }
            });
        }
    });
});

// EDITING the post here
router.put('/:course_id/:id/:post_id', coursePostOwned, (req, res) =>{
    courseUpload(req, res, (err) =>{
        if(err){
            console.log('Failed to upload');
            res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
        } else {
            if(req.file === undefined){
                res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
            } else {
                console.log(req.file);
                const editedPost = { title: req.body.title, description: req.body.description, image: req.body.filename };
                CoursePost.findByIdAndUpdate(req.params.post_id, editedPost, (err, updatedPost) =>{
                    if(err){ 
                        res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
                    } else {
                        res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
                }
            });
        }
    } 
    });
});

// Deleting the post
router.delete('/:course_id/:id/:post_id', coursePostOwned, (req, res) => {
    CoursePost.findByIdAndRemove(req.params.post_id, (err) => {
        if(err){
            res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
        } else {
            res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
        }
    });
});

// Upload files, Only for faculties
router.post('/:course_id/:id/file', (req, res) => {
    upload(req, res, (err) => {
        if(err){
            console.log(err);
            res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
        } else {
            if(req.file === undefined){
                console.log('No file selected!');
                res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
            } else {
                Course.findById(req.params.course_id, (err, course) =>{
                    if(err){
                        console.log(err);
                    } else {
                        const newFile = new CourseFile({
                            filePath: req.file.path,
                            description: req.body.description, 
                            code: course.code,
                            author: {
                                id: req.user._id, 
                                username: req.user.fname
                            }
                        });
                        newFile.save();
                        console.log(req.file);
                        res.redirect('/courses/' + req.params.course_id + '/' + req.params.id);
                    }
                });
            }
        }
    });
});

// Download files, for everyone
router.get('/:course_id/:id/download/:file_id', (req, res) => {
    CourseFile.findById(req.params.file_id, (err, foundFile) => {
        if(err){
            console.log(err);
        } else {
            res.download(foundFile.filePath);
        }
    }); 
});


// SEARCHING for a particular student by faculty.
router.post('/student',(req, res) => {
    var searchregno = req.body.searchregno.toUpperCase();
    User.findOne({ regno: searchregno }, (err, student) => {
        if(err) {
            console.log(err);
        } else {
            res.render('courses/onestudent', { user: req.user, student: student});
        }
    });
});

module.exports = router;