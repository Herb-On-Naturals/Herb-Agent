const express = require('express');
const router = express.Router();
const { Conversation } = require('../models');

// ==================== FOLLOW-UP CONFIG ====================
const FOLLOWUP_MESSAGES = {
    first: 'Template: medicine_followup_7days'
};

const FOLLOWUP_INTERVALS = {
    first: 7 * 24 * 60 * 60 * 1000,   // 7 days
    second: 7 * 24 * 60 * 60 * 1000,  // 7 days
    final: 7 * 24 * 60 * 60 * 1000    // 7 days
};

// ==================== GET PENDING FOLLOW-UPS ====================
router.get('/followups/pending', async (req, res) => {
    try {
        const now = new Date();
        const pending = await Conversation.find({
            status: { $in: ['active', 'interested'] },
            followUpAt: { $lte: now },
            followUpCount: { $lt: 1 }
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
            followUpCount: { $lt: 1 }
        }).limit(20);

        let sent = 0, closed = 0;
        const results = [];

        for (const conv of conversations) {
            let message = FOLLOWUP_MESSAGES.first;

            // Add follow-up message to conversation
            conv.messages.push({
                role: 'assistant',
                content: `[AUTO FOLLOW-UP] Sent template: medicine_followup_7days`,
                timestamp: now
            });

            conv.followUpCount += 1;
            conv.lastMessageAt = now;

            // Schedule next follow-up or close (Only 1 follow-up now)
            if (conv.followUpCount >= 1) {
                conv.status = 'closed';
                conv.followUpAt = null;
                closed++;
            } else {
                conv.followUpAt = new Date(now.getTime() + FOLLOWUP_INTERVALS.first);
                sent++;
            }

            await conv.save();

            // Try to send via WhatsApp (Template)
            try {
                const axios = require('axios');
                const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WA_PHONE_NUMBER_ID;
                const token = process.env.META_ACCESS_TOKEN || process.env.META_WA_ACCESS_TOKEN;
                const apiVersion = process.env.META_WA_API_VERSION || ((process.env.META_WA_API_VERSIONS || 'v18.0').split(',')[0] || 'v18.0').trim();
                if (phoneId && token) {
                    await axios.post(
                        `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`,
                        {
                            messaging_product: 'whatsapp',
                            to: conv.phone,
                            type: 'template',
                            template: {
                                name: 'medicine_followup_7days',
                                language: {
                                    code: 'en'
                                }
                            }
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
            followUpCount: { $lt: 1 },
            status: { $in: ['active', 'interested'] }
        });
        const scheduled = await Conversation.countDocuments({
            followUpAt: { $gt: new Date() },
            followUpCount: { $lt: 1 },
            status: { $in: ['active', 'interested'] }
        });
        const closedByFollowup = await Conversation.countDocuments({
            followUpCount: { $gte: 1 },
            status: 'closed'
        });

        res.json({ success: true, pending, scheduled, closedByFollowup });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
