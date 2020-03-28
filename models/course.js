const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    code:{
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    teaching: Boolean,
    faculty:{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }, 
        username: String,
        contact: Number
    },
    students: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            regno: String,
            username: String,
            email: String,
            contact: Number
        }
    ]
});

module.exports = mongoose.model("Course", CourseSchema);

