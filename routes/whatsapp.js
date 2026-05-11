const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Order, CallLog } = require('../models');

// ==================== CONFIG ====================
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WA_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_WA_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
const META_API_VERSION = process.env.META_WA_API_VERSION || ((process.env.META_WA_API_VERSIONS || 'v18.0').split(',')[0] || 'v18.0').trim();
const GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

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
