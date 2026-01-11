const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, phoneNumber, password } = req.body;
    
    // Check if user exists (email or phone)
    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (userExists) return res.status(400).json({ message: 'User with this email or phone already exists' });

    const user = await User.create({ username, email, phoneNumber, password });
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Users (for demo purposes) - Filtered to exclude current user
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search User by Phone
router.get('/search', async (req, res) => {
    try {
        const { phone } = req.query;
        if(!phone) return res.status(400).json({ message: 'Phone number required' });
        
        const user = await User.findOne({ phoneNumber: phone }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
