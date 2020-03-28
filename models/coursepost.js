const mongoose = require('mongoose');

const CoursePostSchema = new mongoose.Schema({
    code: String,
    verified: Boolean,
    title: String,
    description: String,
    image: String, 
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        regno: String,
        username: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

module.exports = mongoose.model("CoursePost", CoursePostSchema);