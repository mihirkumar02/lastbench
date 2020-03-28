const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        name: String
    },
    receiver: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        regno: String,
        name: String
    },
    message: String
},{timestamps: true});

module.exports = mongoose.model("Message", messageSchema);