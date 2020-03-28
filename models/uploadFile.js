const mongoose = require('mongoose');

const uploadFileSchema = new mongoose.Schema({
    filePath: String,
    description: String,
    code: String,
    author: { 
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Upload", uploadFileSchema);