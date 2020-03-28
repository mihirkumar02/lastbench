const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    regno: {
        type: String,
        required: true,
        unique: true
    },
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    password: {
        type: String,
        required: true
    },
    code: String,
    date: {
        type: Date,
        default: Date.now
    }, 
    contact: {
        type: Number,
        required: true,
    }, 
    website: String,
    about: String,
    interests: String,
    country: String,
    city: String,
    userImage: {
        type: String,
        default: 'default.png'
    },
    role: String,
    courses: []
    /*friends: [
        {
            id:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            fname: String,
            lname: String,
            website: String,
            city: String,
            country: String,
            userImage: String
        }
    ] */
});

module.exports = mongoose.model('user', UserSchema);