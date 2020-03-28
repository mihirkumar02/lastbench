const Post = require('../models/post');
const Comment = require('../models/comment');
const User    = require('../models/user');
const CoursePost = require('../models/coursepost');

module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if(req.isAuthenticated()){
            return next();
        } 
        req.flash('error_msg', 'Please log in to view this resource!');
        res.redirect('/users/login');
    },
    postOwned: function(req, res, next) {
            if(req.isAuthenticated()){
                Post.findById(req.params.post_id, function(err, foundPost){
                    if(err){
                        req.flash("error_msg", "Post not found!");
                        res.redirect("back");
                    } else {
                        if((foundPost.author.id.equals(req.user._id)) || req.user.fname === 'Admin'){
                            next();
                        } else {
                            req.flash("error_msg", "You don't have permission to do that!");
                            res.redirect("back");
                        }
                    }
                });
            } else {
                req.flash("error_msg", "You need to log in to view that resource!");
                res.redirect("back");
            }
        }, 
    coursePostOwned: function(req, res, next) {
        if(req.isAuthenticated()){
            CoursePost.findById(req.params.post_id, function(err, foundPost){
                if(err){
                    req.flash("error_msg", "Post not found!");
                    res.redirect("back");
                } else {
                    if((foundPost.author.id.equals(req.user._id)) || req.user.role === 'Admin' || req.user.role === 'Faculty'){
                        next();
                    } else {
                        req.flash("error_msg", "You don't have permission to do that!");
                        res.redirect("back");
                    }
                }
            });
        } else {
            req.flash("error_msg", "You need to log in to view that resource!");
            res.redirect("back");
        }
    },
    isAdmin: function(req, res, next) {
        if(req.isAuthenticated()){
            if(req.user.fname === 'Admin'){
                next();
            } else {
                req.flash("error_msg", "Sorry! Only Administrators can view this page!");
                res.redirect("/admin/courses");
            }
        } else {
            req.flash("error_msg", "You need to be an Admininstrator to view this page!");
            res.redirect("/admin/courses");
        }
    },
    commentOwned: function(req, res, next){
        if(req.isAuthenticated()){
            Comment.findById(req.params.comment_id, function(err, foundComment){
                if(err){
                    res.redirect('/dashboard');
                } else {
                    // Does user own the post?
                    if((foundComment.author.id.equals(req.user._id)) || req.user.fname === 'Admin'){
                        next();
                    } else {
                        res.redirect('back');
                    }
                }
            });
        } else {
            console.log("You need to be logged in!");
            res.redirect('back');
        }
    }
}