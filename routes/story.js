const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    image: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: Date.now() + 24 * 60 * 60 * 1000 // Set expiration to 24 hours from creation
    },
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

// Index the expiresAt field
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // This line sets the documents to expire immediately after the specified time

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
