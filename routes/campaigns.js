const express = require('express');
const router = express.Router();
const { Campaign, Order } = require('../models');

// ==================== CREATE CAMPAIGN ====================
router.post('/campaigns', async (req, res) => {
    try {
        const { name, description, orderIds } = req.body;
        if (!name || !orderIds || !orderIds.length) {
            return res.status(400).json({ success: false, message: 'Name and orderIds required' });
        }

        // Fetch order details for selected orders
        const orders = await Order.find({ orderId: { $in: orderIds } }).lean();
        const campaignOrders = orders.map(o => ({
            orderId: o.orderId,
            customerName: o.customerName,
            mobile: o.mobile || o.telNo,
            items: (o.items || []).map(i => i.description).join(', '),
            total: o.total,
            callStatus: 'Pending',
            callResult: ''
        }));

        const campaign = new Campaign({
            campaignId: 'CAMP-' + Date.now(),
            name,
            description: description || '',
            status: 'Draft',
            orders: campaignOrders,
            stats: { totalOrders: campaignOrders.length }
        });

        await campaign.save();
        res.json({ success: true, campaign });
    } catch (err) {
        console.error('❌ Error creating campaign:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET ALL CAMPAIGNS ====================
router.get('/campaigns', async (req, res) => {
    try {
        const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(100).lean();
        res.json({ success: true, campaigns });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET SINGLE CAMPAIGN ====================
router.get('/campaigns/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ campaignId: req.params.id }).lean();
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
        res.json({ success: true, campaign });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== UPDATE CAMPAIGN STATUS ====================
router.patch('/campaigns/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const campaign = await Campaign.findOneAndUpdate(
            { campaignId: req.params.id },
            { status, ...(status === 'Completed' ? { completedAt: new Date() } : {}) },
            { new: true }
        );
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
        res.json({ success: true, campaign });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== DELETE CAMPAIGN ====================
router.delete('/campaigns/:id', async (req, res) => {
    try {
        await Campaign.findOneAndDelete({ campaignId: req.params.id });
        res.json({ success: true, message: 'Campaign deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
