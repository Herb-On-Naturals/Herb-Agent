const express = require('express');
const router = express.Router();
const { Conversation } = require('../models');

// ==================== FOLLOW-UP CONFIG ====================
const FOLLOWUP_MESSAGES = {
    first: '🙏 Namaste ji! Humne aapko pehle message kiya tha. Kya aapne dekha? Agar koi sawaal hai toh batayein — hum yahan hain aapki madad ke liye! 😊',
    second: '🎁 Ji, hum abhi bhi aapke liye available hain! Aapke liye ek special offer hai — agar aaj order karein toh extra discount milega. Batayein kya chahiye? 🌿',
    final: '👋 Ji, lagta hai aap abhi busy hain. Koi baat nahi! Jab bhi aapko Herbon products chahiye, bas hume message kar dijiye. Dhanyavaad! 🙏'
};

const FOLLOWUP_INTERVALS = {
    first: 24 * 60 * 60 * 1000,   // 24 hours
    second: 48 * 60 * 60 * 1000,  // 48 hours
    final: 72 * 60 * 60 * 1000    // 72 hours
};

// ==================== GET PENDING FOLLOW-UPS ====================
router.get('/followups/pending', async (req, res) => {
    try {
        const now = new Date();
        const pending = await Conversation.find({
            status: { $in: ['active', 'interested'] },
            followUpAt: { $lte: now },
            followUpCount: { $lt: 3 }
        }).sort({ followUpAt: 1 }).limit(50);

        res.json({ success: true, pending, count: pending.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== RUN FOLLOW-UPS ====================
router.post('/followups/run', async (req, res) => {
    try {
        const now = new Date();
        const conversations = await Conversation.find({
            status: { $in: ['active', 'interested'] },
            followUpAt: { $lte: now },
            followUpCount: { $lt: 3 }
        }).limit(20);

        let sent = 0, closed = 0;
        const results = [];

        for (const conv of conversations) {
            let message;
            if (conv.followUpCount === 0) {
                message = FOLLOWUP_MESSAGES.first;
            } else if (conv.followUpCount === 1) {
                message = FOLLOWUP_MESSAGES.second;
            } else {
                message = FOLLOWUP_MESSAGES.final;
            }

            // Add follow-up message to conversation
            conv.messages.push({
                role: 'assistant',
                content: `[AUTO FOLLOW-UP #${conv.followUpCount + 1}] ${message}`,
                timestamp: now
            });

            conv.followUpCount += 1;
            conv.lastMessageAt = now;

            // Schedule next follow-up or close
            if (conv.followUpCount >= 3) {
                conv.status = 'closed';
                conv.followUpAt = null;
                closed++;
            } else {
                const nextInterval = conv.followUpCount === 1 ? FOLLOWUP_INTERVALS.second : FOLLOWUP_INTERVALS.final;
                conv.followUpAt = new Date(now.getTime() + nextInterval);
                sent++;
            }

            await conv.save();

            // Try to send via WhatsApp (optional — may fail)
            try {
                const axios = require('axios');
                const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
                const token = process.env.META_ACCESS_TOKEN;
                if (phoneId && token) {
                    await axios.post(
                        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
                        {
                            messaging_product: 'whatsapp',
                            to: conv.phone,
                            type: 'text',
                            text: { body: message }
                        },
                        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                    );
                }
            } catch (e) {
                console.log(`⚠️ Follow-up WhatsApp send failed for ${conv.customerName}: ${e.message}`);
            }

            results.push({
                customerName: conv.customerName,
                phone: conv.phone,
                followUpNumber: conv.followUpCount,
                status: conv.status
            });
        }

        res.json({
            success: true,
            message: `Follow-ups: ${sent} sent, ${closed} closed`,
            sent, closed,
            results
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== SCHEDULE FOLLOW-UP FOR A CONVERSATION ====================
router.post('/followups/schedule/:convId', async (req, res) => {
    try {
        const conv = await Conversation.findById(req.params.convId);
        if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

        const delayMs = req.body.delayHours ? req.body.delayHours * 60 * 60 * 1000 : FOLLOWUP_INTERVALS.first;
        conv.followUpAt = new Date(Date.now() + delayMs);
        await conv.save();

        res.json({ success: true, message: `Follow-up scheduled for ${conv.customerName}`, followUpAt: conv.followUpAt });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET FOLLOW-UP STATS ====================
router.get('/followups/stats', async (req, res) => {
    try {
        const pending = await Conversation.countDocuments({
            followUpAt: { $lte: new Date() },
            followUpCount: { $lt: 3 },
            status: { $in: ['active', 'interested'] }
        });
        const scheduled = await Conversation.countDocuments({
            followUpAt: { $gt: new Date() },
            followUpCount: { $lt: 3 },
            status: { $in: ['active', 'interested'] }
        });
        const closedByFollowup = await Conversation.countDocuments({
            followUpCount: { $gte: 3 },
            status: 'closed'
        });

        res.json({ success: true, pending, scheduled, closedByFollowup });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
