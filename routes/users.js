const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/Instagram-Clone-Second', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  bio: String,
  profilePic: { type: String, default: 'default.jpeg' },
  email: { type: String, required: true },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // Change "user" to "User" to match the model name
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // Change "user" to "User" to match the model name
  }],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post' // Assuming you have a Post model
  }],
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story' // Assuming you have a Post model
  }],
  saved: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post' // Assuming you have a Post model
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message' // Assuming you have a Message model
  }]
});

// Plug in passport-local-mongoose to handle password hashing and user authentication
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
