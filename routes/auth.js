const express = require('express');
const router = express.Router();
const { User } = require('../models');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }
        
        // 1. Check in agent_users first (Admin/Manager manually created)
        let user = await User.findOne({ username, password, active: true }).lean();
        
        if (!user) {
            // 2. Check in employees collection (OMS agents)
            const employee = await mongoose.connection.db.collection('employees').findOne({ employeeId: username });
            
            if (employee) {
                // Verify bcrypt password
                const isMatch = await bcrypt.compare(password, employee.password);
                
                if (isMatch) {
                    user = {
                        username: employee.employeeId,
                        name: employee.name,
                        role: 'Agent', // All imported employees are agents
                        active: true
                    };
                }
            }
        }
        
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

// ==================== TOGGLE TEAM MEMBER ACTIVE ====================
router.put('/team/:id', async (req, res) => {
    try {
        const { active } = req.body;
        await User.findByIdAndUpdate(req.params.id, { active });
        res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== REMOVE TEAM MEMBER ====================
router.delete('/team/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
