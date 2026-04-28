/**
 * AUTHENTICATION ROUTES
 * 
 * Defines endpoints for managing users and sessions.
 * Handled Routes:
 * - POST /register: Account creation.
 * - POST /login: Identity verification.
 * - GET /users: Contact discovery (public list).
 * - GET /search: Phone-based lookup.
 */

const express = require('express');
const jwt = require('jsonwebtoken'); // JSON Web Tokens for secure session management
const User = require('../models/User');
const router = express.Router();

/**
 * TOKEN GENERATOR
 * Signs a JWT with the user's ID. This token is sent to the client 
 * and used for subsequent authenticated requests.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

/**
 * REGISTRATION ENDPOINT
 * 1. Checks for duplicate accounts.
 * 2. Creates a new user record.
 * 3. Returns the user profile + session token.
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, phoneNumber, password } = req.body;
    
    // Safety check: Avoid duplicate identity entries
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

/**
 * LOGIN ENDPOINT
 * Verifies credentials and issues a fresh session token.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Compare entered password with hashed DB record via model method
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

/**
 * USER DISCOVERY ENDPOINT
 * Returns a list of all registered users (minus passwords) to help 
 * review the contact search functionality.
 */
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * PHONE SEARCH ENDPOINT
 * Allows users to find specific contacts by entering their phone number.
 */
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
