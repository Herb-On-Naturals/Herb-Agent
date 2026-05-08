const express = require('express');
const router = express.Router();
const { CustomerProfile } = require('../models');

// ==================== GET ALL LEADS ====================
router.get('/leads', async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};
        
        if (status) query.leadStatus = status;
        if (search) {
            query.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        
        const leads = await CustomerProfile.find(query).sort({ updatedAt: -1 }).limit(100).lean();
        res.json({ success: true, leads });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== UPDATE LEAD STATUS ====================
router.post('/leads/:phone/status', async (req, res) => {
    try {
        const { phone } = req.params;
        const { status } = req.body;
        
        if (!status) return res.status(400).json({ success: false, message: 'Status required' });
        
        const lead = await CustomerProfile.findOneAndUpdate(
            { phone: { $regex: phone.slice(-10) } },
            { $set: { leadStatus: status } },
            { new: true }
        );
        
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        
        res.json({ success: true, lead });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== ADD NOTE TO LEAD ====================
router.post('/leads/:phone/notes', async (req, res) => {
    try {
        const { phone } = req.params;
        const { note } = req.body;
        
        if (!note) return res.status(400).json({ success: false, message: 'Note required' });
        
        const lead = await CustomerProfile.findOneAndUpdate(
            { phone: { $regex: phone.slice(-10) } },
            { $set: { notes: note } },
            { new: true }
        );
        
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        
        res.json({ success: true, lead });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
