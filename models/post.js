const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: String,
    description: String,
    image: String,
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
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

module.exports = mongoose.model("Post", PostSchema);