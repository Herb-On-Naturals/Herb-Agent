const express = require('express');
const router = express.Router();
const { Order, Reorder } = require('../models');

// ==================== GET DELIVERED ORDERS ====================
router.get('/delivered-orders', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', startDate, endDate } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = { status: 'Delivered' };

        // Date filter on deliveredAt
        if (startDate || endDate) {
            query.deliveredAt = {};
            if (startDate) {
                const s = new Date(startDate);
                s.setHours(0, 0, 0, 0);
                query.deliveredAt.$gte = s.toISOString();
            }
            if (endDate) {
                const e = new Date(endDate);
                e.setHours(23, 59, 59, 999);
                query.deliveredAt.$lte = e.toISOString();
            }
        }

        // Search by name or mobile
        if (search) {
            query.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { telNo: { $regex: search, $options: 'i' } },
                { orderId: { $regex: search, $options: 'i' } }
            ];
        }

        const [orders, total] = await Promise.all([
            Order.find(query).sort({ deliveredAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
            Order.countDocuments(query)
        ]);

        res.json({
            success: true,
            orders,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error('❌ Error fetching delivered orders:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET SINGLE ORDER ====================
router.get('/order/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId }).lean();
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== REORDER FROM DELIVERED ====================
router.post('/reorder/:orderId', async (req, res) => {
    try {
        const original = await Order.findOne({ orderId: req.params.orderId }).lean();
        if (!original) return res.status(404).json({ success: false, message: 'Original order not found' });

        // Build items from request or original
        const items = req.body.items || original.items || [];
        const total = req.body.total || items.reduce((s, i) => s + (i.amount || i.price * i.quantity || 0), 0);

        // Generate new order ID: REORD-timestamp
        const newOrderId = 'REORD-' + Date.now();
        const now = new Date().toISOString();

        // Create new order in the SAME orders collection
        const newOrder = new Order({
            orderId: newOrderId,
            timestamp: now,
            employee: 'Sales Agent',
            employeeId: 'AGENT',
            customerName: req.body.customerName || original.customerName,
            telNo: req.body.telNo || original.telNo,
            mobile: req.body.mobile || original.mobile,
            altNo: original.altNo,
            email: original.email,
            address: req.body.address || original.address,
            hNo: original.hNo,
            blockGaliNo: original.blockGaliNo,
            villColony: original.villColony,
            landmark: original.landmark || original.landMark,
            landMark: original.landmark || original.landMark,
            postOfficeName: original.postOfficeName,
            po: original.po,
            tahTaluka: original.tahTaluka,
            distt: original.distt,
            city: req.body.city || original.city,
            state: req.body.state || original.state,
            pin: req.body.pin || original.pin || original.pincode,
            pincode: req.body.pincode || original.pincode || original.pin,
            orderType: original.orderType || 'Reorder',
            date: now.split('T')[0],
            time: now.split('T')[1].split('.')[0],
            treatment: original.treatment,
            paymentMode: req.body.paymentMode || original.paymentMode || 'COD',
            total: total,
            codAmount: total,
            items: items,
            status: 'Pending',
            remarks: [{
                text: `Reorder from delivered order ${original.orderId}`,
                addedBy: 'Sales Agent',
                addedAt: now,
                timestamp: now
            }]
        });

        await newOrder.save();

        // Track in reorders collection
        const reorder = new Reorder({
            reorderId: 'RO-' + Date.now(),
            originalOrderId: original.orderId,
            newOrderId: newOrderId,
            customerName: newOrder.customerName,
            mobile: newOrder.mobile || newOrder.telNo,
            address: newOrder.address,
            state: newOrder.state,
            items: items,
            total: total,
            paymentMode: newOrder.paymentMode,
            source: req.body.source || 'Manual'
        });
        await reorder.save();

        res.json({
            success: true,
            message: 'Reorder created successfully!',
            newOrderId,
            order: newOrder
        });
    } catch (err) {
        console.error('❌ Error creating reorder:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET REORDER HISTORY ====================
router.get('/reorders', async (req, res) => {
    try {
        const reorders = await Reorder.find().sort({ createdAt: -1 }).limit(100).lean();
        res.json({ success: true, reorders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== DASHBOARD STATS ====================
router.get('/stats', async (req, res) => {
    try {
        const [totalDelivered, totalReorders, reordersList] = await Promise.all([
            Order.countDocuments({ status: 'Delivered' }),
            Reorder.countDocuments(),
            Reorder.find().sort({ createdAt: -1 }).limit(5).lean()
        ]);

        const totalReorderRevenue = await Reorder.aggregate([
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalDelivered,
                totalReorders,
                reorderRate: totalDelivered > 0 ? ((totalReorders / totalDelivered) * 100).toFixed(1) : 0,
                totalRevenue: totalReorderRevenue[0]?.total || 0,
                recentReorders: reordersList
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
