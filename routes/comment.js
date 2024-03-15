
const mongoose = require("mongoose");

// Define Mongoose Schema for Comments

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    text: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model for comment authors
        required: true
    },
    createdAt: { type: Date, default: Date.now }
});

// Define Mongoose Model for Comments
module.exports = mongoose.model('Comment', commentSchema);