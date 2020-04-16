const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const { ensureAuthenticated, postOwned, commentOwned } = require('../config/auth');



// Profile picture upload

// Set Storage Engine
const storage = multer.diskStorage({
    destination: './public/upload/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize Upload 
const upload = multer({
    storage: storage,
    limits: {fileSize : 10000000000}, //(in bytes)
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('uploadImage');


// Dashboard posts upload

// Set Storage Engine
const postStorage = multer.diskStorage({
    destination: './public/dashboard/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize Upload 
const uploadPost = multer({
    storage: postStorage,
    limits: {fileSize : 10000000000}, //(in bytes)
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('image');


// Check file type
function checkFileType(file, cb){
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}


// ===============================


// LANDING PAGE
router.get("/", (req, res) => res.render("welcome"));

// USER WELCOME PAGE
router.get('/dashboard', ensureAuthenticated, (req, res)=> {
    res.render('welcomeuser', { user: req.user });
});

// USER DASHBOARD
router.get("/dashboard/:id", ensureAuthenticated, (req, res) => 
    Post.find({}, function(err, allPosts){
        if(err) throw err;
        else{
            /* Course.find({}, (err, allCourses) => {
                if(err) {
                    console.log(err);
                } else { */
                res.render("dashboard", { user: req.user, posts: allPosts });
            }
}));

// NEW POST FORM
router.get("/dashboard/:id/new", ensureAuthenticated, (req, res) => {
    res.render('posts/new', {user: req.user});
});


// POST ROUTE FOR NEW POST
router.post('/dashboard/:id', ensureAuthenticated, function(req, res){
    uploadPost(req, res, (err) => {
        if(err){
            console.log(err);
            res.redirect('/dashboard/' + req.params.id);
        } else {
            if(req.file === undefined){
                console.log('No file selected!');
                res.redirect('/dashboard/' + req.params.id);
            } else {
                const { title, description } = req.body;
                const author = {
                    id: req.user._id,
                    username: req.user.fname
                };
                const newPost = new Post({
                    title: title, description: description, author: author, image: req.file.filename
                });
                newPost.save()
                    .then(post => {
                        console.log(req.file);
                        req.flash('success_msg', 'New post added successfully');
                        res.redirect('/dashboard/' + req.params.id);
                    })
                    .catch(err => console.log(err));
            }
        }
    });
});


// SHOW EACH POST
router.get('/dashboard/:id/:post_id', ensureAuthenticated, function(req, res){
    Post.findById(req.params.post_id).populate('comments').exec(function(err, foundPost){
        if(err) throw err;
        else {
            res.render('posts/show', {user: req.user, post: foundPost});
        }
    });
});

// EDIT POST ROUTE, get the edit form
router.get('/dashboard/:id/:post_id/edit', postOwned, function(req, res){
    Post.findById(req.params.post_id, function(err, foundPost){
        res.render('posts/edit', {user: req.user, post: foundPost});
    });
});

// POST ROUTE FOR EDITING a post
router.put('/dashboard/:id/:post_id', postOwned, function(req, res){
    const editedPost = {title: req.body.title, description: req.body.description, image: req.body.image};
    Post.findByIdAndUpdate(req.params.post_id, editedPost, function(err, updatedPost){
        if(err){
            res.redirect('/dashboard');
        } else {
            res.redirect('/dashboard/' + req.params.id + '/' + req.params.post_id);
        }
    });
});

// DELETE POST
router.delete('/dashboard/:id/:post_id', postOwned, function(req, res){
    Post.findByIdAndRemove(req.params.post_id, function(err){
        if(err){
            res.redirect('/dashboard/' + req.params.post_id);
        } else {
            console.log('Post deleted!');
            res.redirect('/dashboard/' + req.params.id);
        }
    });
});

// SEE MY POSTS 
router.get('/myposts/:id', ensureAuthenticated, (req, res) => {
    Post.find({}, (err, foundPosts) => {
        if(err){
            console.log(err);
        } else {
            res.render('posts/myposts', {user: req.user, posts: foundPosts});
        }
    }); 
});




// ===========================
// COMMENTS ROUTES
// ===========================


// NEW COMMENT FORM
router.get('/dashboard/:id/:post_id/comments/new', ensureAuthenticated, function(req, res){
    Post.findById(req.params.post_id, function(err, post){
        if(err){
            console.log(err);
        } else {
            res.render('comments/new', {post: post, user: req.user });
        }
    });
});

// POSTING THE COMMENT
router.post('/dashboard/:id/:post_id', ensureAuthenticated, function(req, res){
    Post.findById(req.params.post_id, function(err, post){
        if(err){
            console.log(err);
        } else {
            // Create new comment
            const text = req.body.text;
            const author = {
                id: req.user._id,
                username: req.user.fname
            };
            const newComment = new Comment({
                text: text, author: author
            });
            newComment.save()
                .then(comment => {
                    post.comments.push(comment);
                    post.save();
                    res.redirect('/dashboard/' + req.user._id + '/' + post._id);
                })
                .catch(err => console.log(err));
        }
    });
});

// EDITING COMMENTS

router.get('/dashboard/:id/:post_id/comments/:comment_id/edit', ensureAuthenticated, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect('back');
        } else {
            res.render('comments/edit', {post_id: req.params.post_id, comment: foundComment, user: req.user });
        }
    });
});

// UPDATING COMMENTS
router.put('/dashboard/:id/:post_id/comments/:comment_id', ensureAuthenticated, function(req, res){
    const editedComment = {text: req.body.text};
    Comment.findByIdAndUpdate(req.params.comment_id, editedComment, function(err, updatedComment){
        if(err){
            res.redirect('back');
        } else {
            res.redirect('/dashboard/' + req.params.post_id);
        }
    });
});

// DELETING COMMENT

router.delete('/dashboard/:id/:post_id/comments/:comment_id', ensureAuthenticated, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect('back');
        } else {
            res.redirect('/dashboard/' + req.params.post_id);
        }
    });
});



// ========================
// ==== PROFILE ROUTES ====
// ========================


router.get("/profile/:id", ensureAuthenticated, (req, res) => res.render("profile", {user: req.user }));


// PROFILE PICTURE ROUTE

router.post('/profile/:id', ensureAuthenticated, (req, res) => {
    upload(req, res, (err) => {
        if(err) {
            console.log('Failed to upload!');
            res.render('profile', { msg: err, user: req.user });
        } else {
            if(req.file == undefined){
                res.render('profile', { msg: 'No image selected!', user: req.user });
            } else {
                console.log(req.file);
                User.findOneAndUpdate({ email: req.user.email}, { userImage: req.file.filename })
                    .then(user => {
                        if(user) {
                            res.render('profile', { msg: 'Profile picture updated!', user: req.user, file: `upload/${req.file.filename}`});
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        res.render('profile', { msg: 'Upload failed!', user: req.user });
                    });
            } 
        }
    });
});

// PROFILE EDIT ROUTE

router.get('/profile/:id/edit', ensureAuthenticated, (req, res) => {
    res.render("editprofile", { user: req.user });
});

router.put('/profile/:id', ensureAuthenticated, (req, res) => {
    const editedProfile = {fname: req.body.fname, lname: req.body.lname, contact: req.body.contact, website: req.body.website, about: req.body.about, interests: req.body.interests, city: req.body.city, country: req.body.country};
    User.findByIdAndUpdate(req.params.id, editedProfile, (err, updatedUser) => {
        if(err){
            console.log(err);
            res.redirect('back');
        } else {
            console.log('Profile Information updated!');
            res.redirect('/profile/' + req.params.id);
        }
    });
});


// ===============================


// About us and contact us page
router.get('/educafe', (req, res) => {
    res.render('educafe');
});



module.exports = router;