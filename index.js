// index.js
const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const { User, Post } = require('./schema.js');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 8001;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

async function DBconnection() {
  try { await mongoose.connect("mongodb+srv://Shivani1603:Shivani1603@atlascluster.lm8gndu.mongodb.net/foru?retryWrites=true&w=majority&appName=AtlasCluster", {
    
    serverSelectionTimeoutMS: 5000, // Increase timeout to 5 seconds
    connectTimeoutMS: 10000, // Increase connection timeout to 10 seconds
  });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

DBconnection();

app.get("/", function (req, res) {
  res.send("hiiiiiiiiiiiiiiiiiiiiiiii");
});

app.post('/signup', async (req, res) => {
  try {
    const { username, emailid, password } = req.body;

    const existingUser = await User.findOne({ emailid }).maxTimeMS(30000);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists. Please login.' });
    }

    const existingUsername = await User.findOne({ username }).maxTimeMS(30000);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username is already taken. Please choose another one.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailid)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const encryptedUserPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      emailid,
      password: encryptedUserPassword,
    });

    res.status(201).json({ status: 'success', msg: 'User added successfully.' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ status: 'failure', msg: "Couldn't signup. Please try again later.", error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    res.status(200).json({ status: 'success', msg: 'Login successful.' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ status: 'failure', msg: "Couldn't login. Please try again later.", error: error.message });
  }
});

// CRUD operations for posts
app.post('/posts', async (req, res) => {
  try {
    const { username, community, title, body } = req.body;

    const newPost = new Post({ username, community, title, body });
    await newPost.save();

    res.status(201).json({ status: 'success', msg: 'Post created successfully.', post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ status: 'failure', msg: "Couldn't create post. Please try again later.", error: error.message });
  }
});

app.get('/get_posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ status: 'failure', msg: "Couldn't fetch posts. Please try again later.", error: error.message });
  }
});

app.put('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body } = req.body;

    const updatedPost = await Post.findByIdAndUpdate(id, { title, body }, { new: true });

    if (!updatedPost) {
      return res.status(404).json({ status: 'failure', msg: 'Post not found.' });
    }

    res.status(200).json({ status: 'success', msg: 'Post updated successfully.', post: updatedPost });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ status: 'failure', msg: "Couldn't update post. Please try again later.", error: error.message });
  }
});

app.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPost = await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ status: 'failure', msg: 'Post not found.' });
    }

    res.status(200).json({ status: 'success', msg: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ status: 'failure', msg: "Couldn't delete post. Please try again later.", error: error.message });
  }
});
