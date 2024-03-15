var express = require('express');
var router = express.Router();
const passport = require('passport');
const userModel = require("./users");
const postModel = require("./post");
const storyModel = require('./story')
const commentModel = require('./comment')
var localStrategy = require('passport-local');
const upload = require("./multer");
passport.use(new localStrategy(userModel.authenticate()))
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));


router.get('/', isLoggedOut, function (req, res) {
  res.render('index', { footer: false });
});
router.get('/userProfile/:userId', isloggedIn, async function (req, res) {
  // Fetch user from session
  const user = await userModel.findOne({ username: req.session.passport.user });
  console.log(user._id)
  // Fetch user with posts
  const postuser = await userModel.findById(req.params.userId)
    .populate('posts'); // Populate user posts

  // Render user profile with footer
  res.render('userProfile', {
    footer: true, // Enable footer
    user, // Pass user object
    postuser // Pass user with posts
  });
});
router.get("/story/:number", isloggedIn, async function (req, res) {
  // Fetch user with stories
  const storyuser = await userModel.findOne({ username: req.session.passport.user })
    .populate("stories");

  // Get story image from array of stories
  const image = storyuser.stories[req.params.number];

  // Check if story number is valid
  if (storyuser.stories.length > req.params.number) {
    // Render story view
    res.render("story", {
      footer: false, // Hide footer
      storyuser: storyuser, // Pass user object
      storyimage: image, // Pass story image object
      number: req.params.number // Pass story number
    });
  } else {
    // Redirect to feed if story number is invalid
    res.redirect("/feed");
  }
});

router.get("/story/:id/:number", isloggedIn, async function (req, res) {
  const storyuser = await userModel.findOne({ _id: req.params.id })
    .populate("stories")

  const image = storyuser.stories[req.params.number];
  // console.log(image.image)
  if (storyuser.stories.length > req.params.number) {
    res.render("story", { footer: false, storyuser: storyuser, storyimage: image, number: req.params.number });
  }
  else {
    res.redirect("/feed");
  }

});


router.get('/login', isLoggedOut, function (req, res) {
  res.render('login', { footer: false });
});

router.get('/feed', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find({ user: { $ne: user._id } }).populate("user");
  // Populate posts with user and comments
  //  const postComments = await postModel.find().populate('user comments').populate({
  //   path: 'comments',
  //   populate: { path: 'author' }
  // });

  const stories = await storyModel.find({ user: { $ne: user._id } })
    .populate('user');

  var obj = {};
  const packs = stories.filter(function (story) {
    if (!obj[story.user._id]) {
      obj[story.user._id] = "ascbvjanscm";
      return true;
    }
  })

  res.render("feed", { footer: true, user, stories: packs, posts });
});

router.get('/profile', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts")
  res.render('profile', { footer: true, user, });
});

router.get('/message', isloggedIn, async function (req, res) {
  const allFollowers = await userModel.findOne({ }).populate("followers")
  res.render('message', { footer: false, allFollowers, });
});
router.get('/message/:userId/chat', isloggedIn, async function (req, res) {
  const user = await userModel.findById( req.params.userId );
  res.render('chat', { footer: false, user, });
});

router.get('/search', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('search', { footer: true, user });
});
router.get('/menu-setup', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('menu', { footer: true, user });
});
router.get('/savedpic', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate('saved');
  // console.log(user)
  res.render('saved', { footer: true, user });
});
// Route for handling comment submission
router.post('/posts/:postId/comment', isloggedIn, async (req, res) => {
  try {
    const postId = req.params.postId;
    // const { text } = req.body;

    // Create a new comment
    const comment = new commentModel({
      postId: postId,
      text: req.body.comment,
      author: req.user._id,
    });

    // Save the comment to the database
    await comment.save();

    // Find the post by ID and push the comment ID to its comments array
    await postModel.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

    res.redirect('/feed')
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/like/:postId', isloggedIn, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id; // Assuming you have user data available in the request (e.g., after authentication)

    // Check if the user has already liked the post
    const post = await postModel.findById(postId);
    const alreadyLikedIndex = post.likes.indexOf(userId);

    if (alreadyLikedIndex === -1) {
      // If the user hasn't liked the post, add their ID to the likes array
      post.likes.push(userId);
    } else {
      // If the user has already liked the post, remove their ID from the likes array (dislike)
      post.likes.splice(alreadyLikedIndex, 1);
    }

    // Save the post with the updated like status
    await post.save();

    // Send the updated like count along with the liked status
    const likeCount = post.likes.length;
    const liked = alreadyLikedIndex === -1; // If alreadyLikedIndex is -1, the user has just liked the post

    res.json({ liked: liked, likeCount: likeCount });
  } catch (error) {
    console.error('Error liking/disliking post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/save/:postId', isloggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const postId = req.params.postId;

    // Check if the post is already saved
    const isSaved = user.saved.indexOf(postId);

    if (isSaved === -1) {
      // If the post is not already saved, save it
      user.saved.push(postId);
    } else {
      user.saved.splice(isSaved, 1);
    }

    await user.save();
    const save = isSaved === -1;


    // Respond with the updated user object and the saved status
    res.json({ user, saved: save });
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/userSearch/:username', isloggedIn, async (req, res) => {
  try {
    const { username } = req.params;
    const regex = new RegExp('^' + username, 'i');

    const users = await userModel.find({
      username: regex,
      _id: { $ne: req.user.id } // Exclude the logged-in user from search results
    });

    res.json(users);
  } catch (error) {
    console.error('Error searching for users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define route to handle requests to /followers
router.get('/followers', isloggedIn, async (req, res) => {

  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

      // Fetch all followers from the database
      const allFollowers = await userModel.find({_id: { $ne: req.user.id }}).populate('followers'); // Assuming you have a followers field in your user model
      // Render a view template with the list of followers
      res.render('followers', {footer: true, allFollowers,user }); // Pass the followers data to your view template
  } catch (error) {
      console.error('Error fetching followers:', error);
      res.status(500).send('Internal Server Error');
  }
});


router.get('/edit', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('edit', { footer: true, user });
});
router.post('/update-profile', isloggedIn, async (req, res) => {
  try {
    // User data from the form
    const { username, bio, name } = req.body;

    // Find the user by ID and update the fields
    const updatedUser = await userModel.findOneAndUpdate(
      { _id: req.user.id },
      { $set: { username, bio, name } },
      { new: true } // to return the updated document
    );

    // If the user is not found, handle the case
    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    // Log in the updated user
    req.login(updatedUser, (err) => {
      if (err) {
        console.error('Error updating session after profile change:', err);
        return res.status(500).send('Internal Server Error');
      }

      // Redirect to the profile page or any other page
      res.redirect('/profile');
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/upload', isloggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('upload', { footer: true, user });
});

router.post('/upload/images', isloggedIn, upload.single("image"), async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  console.log(req.body)
  if (req.body.type === "post") {
    const post = await postModel.create({
      caption: req.body.caption,
      image: req.file.filename,
      user: user._id
    })
    user.posts.push(post._id);
  }
  else if (req.body.type === "story") {
    const story = await storyModel.create({
      image: req.file.filename,
      user: user._id
    })
    user.stories.push(story._id);
  }

  await user.save();
  res.redirect("/feed");

});

router.post('/upload/profilepic', isloggedIn, upload.single("profile"), async function (req, res) {
  console.log(req.file);
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) {
      return res.status(404).send('User not found.');
    }
    if (!req.file) {
      // No file was uploaded
      return res.status(400).send('No file uploaded.');
    }
    // Update the user's picture field with the filename
    user.profilePic = req.file.filename;
    // Save the updated user model
    await user.save();
    // Redirect to the profile page on success
    res.redirect('/edit');
  } catch (error) {
    console.error(error);

  }
});




// POST route for toggling follow/unfollow
router.post('/api/follow/:userId', async (req, res) => {
  try {
    const userId = req.params.userId; // Get user ID from URL params
    const currentUser = req.user; // Assuming user is authenticated and user data is available in request object

    // Logic to toggle follow/unfollow status
    // Example: Check if the current user is already following the target user
    const isFollowing = currentUser.following.includes(userId);

    // Toggle follow status
    if (isFollowing) {
      // Unfollow
      const index = currentUser.following.indexOf(userId);
      currentUser.following.splice(index, 1);

      // Remove the current user from the target user's followers
      var targetUser = await userModel.findById(userId);
      const followerIndex = targetUser.followers.indexOf(currentUser._id);
      targetUser.followers.splice(followerIndex, 1);
      await targetUser.save();
    } else {
      // Follow
      currentUser.following.push(userId);

      // Add the current user to the target user's followers
      var targetUser = await userModel.findById(userId);
      targetUser.followers.push(currentUser._id);
      await targetUser.save();
    }

    // Save the updated user data (assuming you're using Mongoose or similar)
    await currentUser.save();

    // Respond with updated follow status and counts
    res.json({
      isFollowing: !isFollowing,
      followerCount: targetUser.followers.length,
      followingCount: targetUser.following.length
    });
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





router.post('/register', (req, res, next) => {
  const { username, name, email, } = req.body;
  var newUser = {
    //user data here
    username,
    name,
    email,
    //user data here
  };
  userModel.register(newUser, req.body.password)
    .then((result) => {
      passport.authenticate('local')(req, res, () => {
        //destination after user register
        res.redirect('/feed');
      });
    })
    .catch((err) => {
      res.redirect("/login");
    });
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/feed',
  failureRedirect: '/login',
}),
  (req, res, next) => { }
);

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  else res.redirect('/login');
}
function isLoggedOut(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/feed'); // Redirect to feed page if user is already logged in
}


module.exports = router;
