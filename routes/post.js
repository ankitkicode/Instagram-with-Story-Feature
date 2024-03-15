// Require necessary modules
const mongoose = require('mongoose');

// Define the schema for the Post model
const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    image: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User' // Reference to users who liked the post
        }
    ],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
  
});

// Create the Post model using the schema
const Post = mongoose.model('Post', postSchema);

// Export the Post model
module.exports = Post;
