const express = require('express');
const router = express.Router();
const { Order, Reorder, Conversation, CustomerProfile, CallLog, Campaign } = require('../models');

// ==================== OVERVIEW STATS ====================
router.get('/analytics/overview', async (req, res) => {
    try {
        const [
            totalConversations,
            activeConversations,
            reorderedConversations,
            interestedConversations,
            notInterestedConversations,
            totalReorders,
            totalProfiles
        ] = await Promise.all([
            Conversation.countDocuments(),
            Conversation.countDocuments({ status: 'active' }),
            Conversation.countDocuments({ status: 'reordered' }),
            Conversation.countDocuments({ status: 'interested' }),
            Conversation.countDocuments({ status: 'not_interested' }),
            Reorder.countDocuments({ source: 'WhatsApp AI' }),
            CustomerProfile.countDocuments()
        ]);

        // Revenue from AI reorders
        const revenueResult = await Reorder.aggregate([
            { $match: { source: 'WhatsApp AI' } },
            { $group: { _id: null, totalRevenue: { $sum: '$total' }, avgOrder: { $avg: '$total' } } }
        ]);

        const revenue = revenueResult[0] || { totalRevenue: 0, avgOrder: 0 };
        const conversionRate = totalConversations > 0 ? ((reorderedConversations / totalConversations) * 100).toFixed(1) : 0;

        // Customer segments
        const segments = await CustomerProfile.aggregate([
            { $group: { _id: '$segment', count: { $sum: 1 } } }
        ]);

        // Sentiment breakdown
        const sentiments = await Conversation.aggregate([
            { $match: { overallSentiment: { $ne: null } } },
            { $group: { _id: '$overallSentiment', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            overview: {
                totalConversations,
                activeConversations,
                reorderedConversations,
                interestedConversations,
                notInterestedConversations,
                totalReorders,
                totalProfiles,
                revenue: Math.round(revenue.totalRevenue),
                avgOrderValue: Math.round(revenue.avgOrder),
                conversionRate: parseFloat(conversionRate)
            },
            segments: segments.reduce((acc, s) => { acc[s._id || 'Unknown'] = s.count; return acc; }, {}),
            sentiments: sentiments.reduce((acc, s) => { acc[s._id || 'neutral'] = s.count; return acc; }, {})
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== CONVERSION FUNNEL ====================
router.get('/analytics/funnel', async (req, res) => {
    try {
        const total = await Conversation.countDocuments();
        const interested = await Conversation.countDocuments({ status: { $in: ['interested', 'reordered'] } });
        const reordered = await Conversation.countDocuments({ status: 'reordered' });

        const funnel = [
            { stage: 'Contacted', count: total, percent: 100 },
            { stage: 'Interested', count: interested, percent: total > 0 ? Math.round((interested / total) * 100) : 0 },
            { stage: 'Reordered', count: reordered, percent: total > 0 ? Math.round((reordered / total) * 100) : 0 }
        ];

        res.json({ success: true, funnel });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== REVENUE OVER TIME ====================
router.get('/analytics/revenue', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const dailyRevenue = await Reorder.aggregate([
            { $match: { source: 'WhatsApp AI', createdAt: { $gte: since } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, dailyRevenue, days });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== CUSTOMER SEGMENTS ====================
router.get('/analytics/customers', async (req, res) => {
    try {
        const customers = await CustomerProfile.find()
            .sort({ totalSpent: -1 })
            .limit(50);

        const segmentCounts = await CustomerProfile.aggregate([
            { $group: { _id: '$segment', count: { $sum: 1 }, totalSpent: { $sum: '$totalSpent' } } }
        ]);

        res.json({ success: true, customers, segmentCounts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== BOT PERFORMANCE ====================
router.get('/analytics/performance', async (req, res) => {
    try {
        // Avg messages per conversation
        const msgStats = await Conversation.aggregate([
            { $project: { messageCount: { $size: '$messages' }, status: 1, overallSentiment: 1 } },
            {
                $group: {
                    _id: null,
                    avgMessages: { $avg: '$messageCount' },
                    maxMessages: { $max: '$messageCount' },
                    totalMessages: { $sum: '$messageCount' }
                }
            }
        ]);

        // Conversations per day (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const dailyConvs = await Conversation.aggregate([
            { $match: { createdAt: { $gte: weekAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Status breakdown
        const statusBreakdown = await Conversation.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            performance: {
                avgMessagesPerConv: Math.round(msgStats[0]?.avgMessages || 0),
                maxMessagesInConv: msgStats[0]?.maxMessages || 0,
                totalMessages: msgStats[0]?.totalMessages || 0,
                dailyConversations: dailyConvs,
                statusBreakdown: statusBreakdown.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {})
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
