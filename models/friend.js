const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    sender:{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        fname: String,
        lname: String,
        website: String,
        city: String,
        country: String,
        userImage: String
    },
    receiver:{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        fname: String,
        lname: String,
        website: String,
        city: String,
        country: String,
        userImage: String
    },
    accepted: Boolean
});

module.exports = mongoose.model("Friend", friendSchema);