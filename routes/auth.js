const express = require('express');
const router = express.Router();
const { User } = require('../models');

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }
        
        const user = await User.findOne({ username, password, active: true }).lean();
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
        
        // Set session for server.js auth check
        req.session.isAuthenticated = true;
        req.session.user = user;
        
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET TEAM ====================
router.get('/team', async (req, res) => {
    try {
        const team = await User.find().select('-password').sort({ role: 1 }).lean();
        res.json({ success: true, team });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== ADD TEAM MEMBER ====================
router.post('/team', async (req, res) => {
    try {
        const { username, password, role, name } = req.body;
        
        if (!username || !password || !role) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }
        
        const user = new User({ username, password, role, name });
        await user.save();
        
        res.json({ success: true, message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
