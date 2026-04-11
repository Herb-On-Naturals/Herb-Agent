const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Order, CallLog } = require('../models');

// ==================== CONFIG ====================
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const GRAPH_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

function isWhatsAppConfigured() {
    return !!(PHONE_NUMBER_ID && ACCESS_TOKEN);
}

// ==================== SEND WHATSAPP MESSAGE ====================
async function sendWhatsAppMessage(to, message) {
    if (!isWhatsAppConfigured()) throw new Error('WhatsApp API not configured');

    // Clean phone: remove non-digits, add 91 if 10 digits
    let cleanPhone = to.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const response = await axios.post(GRAPH_URL, {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: message }
    }, {
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    return {
        messageId: response.data.messages?.[0]?.id,
        phone: cleanPhone
    };
}

// ==================== STATUS ====================
router.get('/whatsapp/status', (req, res) => {
    res.json({
        success: true,
        configured: isWhatsAppConfigured(),
        phoneNumberId: PHONE_NUMBER_ID ? `...${PHONE_NUMBER_ID.slice(-4)}` : null
    });
});

// ==================== SEND TO SINGLE ORDER ====================
router.post('/whatsapp/send', async (req, res) => {
    try {
        const { orderId, message, messageType } = req.body;

        if (!orderId || !message) {
            return res.status(400).json({ success: false, message: 'orderId and message required' });
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const phone = order.mobile || order.telNo;
        if (!phone) return res.status(400).json({ success: false, message: 'No phone number on order' });

        // Check if WhatsApp is configured
        if (!isWhatsAppConfigured()) {
            // Mock mode
            console.log(`📱 [MOCK WA] Would send to ${phone}: "${message.substring(0, 50)}..."`);

            // Log the message
            await CallLog.create({
                callId: 'WA-MOCK-' + Date.now(),
                orderId: order.orderId || '',
                customerName: order.customerName,
                mobile: phone,
                type: 'whatsapp',
                callStatus: 'Completed',
                status: 'mock',
                result: 'mock_sent',
                notes: `[MOCK] ${message.substring(0, 200)}`,
                duration: 0
            });

            return res.json({
                success: true,
                mode: 'mock',
                message: `[Mock] WhatsApp message simulated to ${order.customerName}`
            });
        }

        // Live mode — send via Meta API
        const result = await sendWhatsAppMessage(phone, message);
        console.log(`✅ WhatsApp sent to ${order.customerName} (${result.phone}), ID: ${result.messageId}`);

        // Log the message
        await CallLog.create({
            callId: 'WA-' + Date.now(),
            orderId: order.orderId || '',
            customerName: order.customerName,
            mobile: phone,
            type: 'whatsapp',
            callStatus: 'Completed',
            status: 'completed',
            result: 'sent',
            notes: message.substring(0, 500),
            duration: 0,
            transcript: `WhatsApp Message ID: ${result.messageId}`
        });

        res.json({
            success: true,
            mode: 'live',
            message: `WhatsApp sent to ${order.customerName}`,
            messageId: result.messageId
        });
    } catch (err) {
        console.error('❌ WhatsApp send error:', err.response?.data || err.message);
        res.status(500).json({
            success: false,
            message: err.response?.data?.error?.message || err.message
        });
    }
});

// ==================== BULK SEND (CAMPAIGN) ====================
router.post('/whatsapp/bulk-send', async (req, res) => {
    try {
        const { orderIds, message } = req.body;

        if (!orderIds || !orderIds.length || !message) {
            return res.status(400).json({ success: false, message: 'orderIds array and message required' });
        }

        const orders = await Order.find({ _id: { $in: orderIds } });
        if (!orders.length) return res.status(404).json({ success: false, message: 'No orders found' });

        let sent = 0, failed = 0, skipped = 0;
        const results = [];

        for (const order of orders) {
            const phone = order.mobile || order.telNo;
            if (!phone) { skipped++; continue; }

            try {
                if (isWhatsAppConfigured()) {
                    // Build personalized message
                    const personalMsg = message
                        .replace(/\{name\}/gi, order.customerName || 'Sir/Ma\'am')
                        .replace(/\{order_id\}/gi, order.orderId || '')
                        .replace(/\{total\}/gi, order.total || '');

                    const result = await sendWhatsAppMessage(phone, personalMsg);

                    await CallLog.create({
                        callId: 'WA-BULK-' + Date.now() + '-' + Math.random().toString(36).substring(7),
                        orderId: order.orderId || '',
                        customerName: order.customerName,
                        mobile: phone,
                        type: 'whatsapp',
                        callStatus: 'Completed',
                        status: 'completed',
                        result: 'sent',
                        notes: personalMsg.substring(0, 500),
                        duration: 0,
                        transcript: `Message ID: ${result.messageId}`
                    });

                    sent++;
                    results.push({ orderId: order.orderId, name: order.customerName, status: 'sent' });

                    // Anti-spam delay: 2-4 sec between messages
                    await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
                } else {
                    // Mock mode
                    console.log(`📱 [MOCK WA BULK] → ${order.customerName} (${phone})`);

                    await CallLog.create({
                        callId: 'WA-BMOCK-' + Date.now() + '-' + Math.random().toString(36).substring(7),
                        orderId: order.orderId || '',
                        customerName: order.customerName,
                        mobile: phone,
                        type: 'whatsapp',
                        callStatus: 'Completed',
                        status: 'mock',
                        result: 'mock_sent',
                        notes: `[MOCK] ${message.substring(0, 200)}`,
                        duration: 0
                    });

                    sent++;
                    results.push({ orderId: order.orderId, name: order.customerName, status: 'mock_sent' });
                }
            } catch (sendErr) {
                failed++;
                results.push({ orderId: order.orderId, name: order.customerName, status: 'failed', error: sendErr.message });
            }
        }

        res.json({
            success: true,
            message: `Bulk WhatsApp: ${sent} sent, ${failed} failed, ${skipped} skipped (no phone)`,
            stats: { sent, failed, skipped, total: orders.length },
            results
        });
    } catch (err) {
        console.error('❌ Bulk WhatsApp error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== MESSAGE TEMPLATES ====================
router.get('/whatsapp/templates', (req, res) => {
    const templates = [
        {
            id: 'reorder_reminder',
            name: '🔄 Reorder Reminder',
            message: `🌿 Namaste {name} ji!\n\nHerbon Naturals se aapka order successfully deliver ho chuka hai. Aapko product kaisa laga?\n\nAgar aap dobara order karna chahte hain toh humse reply karein — hum aapke liye special offer de sakte hain! 🎁\n\n📞 Helpline: 1800-XXX-XXXX\n🌐 www.herbonnaturals.com`
        },
        {
            id: 'feedback_request',
            name: '⭐ Feedback Request',
            message: `Namaste {name} ji! 🙏\n\nAapka Herbon Naturals order (#{order_id}) deliver ho gaya hai.\n\nKya aap humein apna feedback de sakte hain? Aapki rai se hum aur better bana sakte hain.\n\n⭐ Reply mein 1-5 stars dein\n✍️ Ya apne words mein bataein\n\nDhanyavaad! 🌿`
        },
        {
            id: 'special_offer',
            name: '🎁 Special Offer',
            message: `🎉 {name} ji, aapke liye SPECIAL OFFER!\n\nAapko Herbon Naturals products pasand aaye isliye hum aapko de rahe hain:\n\n🏷️ 15% OFF on your next order!\n🚚 FREE Delivery\n⏰ Offer sirf 48 hours ke liye valid hai\n\nOrder karne ke liye reply karein ya call karein.\n📞 Helpline: 1800-XXX-XXXX`
        },
        {
            id: 'new_product',
            name: '🆕 New Product Alert',
            message: `🌿 Namaste {name} ji!\n\nHerbon Naturals ki nayi range launch ho gayi hai!\n\nAapki previous purchase ke basis pe hum recommend karte hain ye products try karein.\n\nJaanna chahte hain toh reply karein 'YES' 👍\n\n🌐 www.herbonnaturals.com`
        },
        {
            id: 'custom',
            name: '✏️ Custom Message',
            message: ''
        }
    ];

    res.json({ success: true, templates });
});

module.exports = router;
