const express = require('express');
const router = express.Router();
const { Deal } = require('../models');

// ==================== GET ALL DEALS ====================
router.get('/', async (req, res) => {
    try {
        const deals = await Deal.find().sort({ updatedAt: -1 }).lean();
        res.json({ success: true, deals });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== CREATE NEW DEAL ====================
router.post('/', async (req, res) => {
    try {
        const { title, value, stage, contact, closeDate, probability, assignedTo } = req.body;
        
        if (!title || !value) {
            return res.status(400).json({ success: false, message: 'Title and value are required' });
        }
        
        const deal = new Deal({
            title,
            value: Number(value),
            stage: stage || 'Prospecting',
            contact,
            closeDate,
            probability: probability || 50,
            assignedTo
        });
        
        await deal.save();
        res.json({ success: true, message: 'Deal created successfully', deal });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== UPDATE DEAL ====================
router.put('/:id', async (req, res) => {
    try {
        const { title, value, stage, contact, closeDate, probability, assignedTo } = req.body;
        
        const updated = await Deal.findByIdAndUpdate(
            req.params.id,
            { title, value, stage, contact, closeDate, probability, assignedTo },
            { new: true }
        );
        
        if (!updated) return res.status(404).json({ success: false, message: 'Deal not found' });
        
        res.json({ success: true, message: 'Deal updated successfully', deal: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== DELETE DEAL ====================
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Deal.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Deal not found' });
        res.json({ success: true, message: 'Deal deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
