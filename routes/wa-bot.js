const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { Order, Reorder, Conversation, Product, CustomerProfile } = require('../models');

// ==================== CONFIG ====================
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WA_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_WA_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const META_API_VERSION = process.env.META_WA_API_VERSION || ((process.env.META_WA_API_VERSIONS || 'v18.0').split(',')[0] || 'v18.0').trim();
const GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
const START_TEMPLATE_NAME = sanitizeValue(process.env.META_WA_TEMPLATE_NAME_START || 'hello_world') || 'hello_world';
const START_TEMPLATE_LANG = sanitizeValue(process.env.META_WA_TEMPLATE_LANG_START || 'en_US') || 'en_US';
const ENFORCE_SIGNATURE = sanitizeValue(process.env.META_ENFORCE_SIGNATURE || 'false').toLowerCase() === 'true';
const WEBSITE_BASE_URL = resolveWebsiteBaseUrl(
    sanitizeValue(process.env.HERB_WEBSITE_URL || process.env.APP_URL || 'https://www.herbonnaturals.com')
);
const COMPANY_PROFILE = `
Brand: Herb On Naturals (Herbon Naturals)
Website: https://www.herbonnaturals.com/
Tagline: "Pure Nature, Pure Wellness"
Type: Premium Ayurvedic & Natural Wellness Company

Brand Certifications:
- FSSAI Approved
- GMP Certified Manufacturing
- AYUSH Ministry Guidelines Compliant
- Lab-Tested Quality (every batch)
- 100% Natural & Chemical-Free
- Cruelty-Free & Toxin-Free

Product Categories (ACTUAL WEBSITE):
1. 💙 Heart Care / Varicose — Vedic Capsule, Pain Snap Prash, Naskhol, Vena-V, Vains Clean, Nadi Yog, Vain's Honey
2. 🦴 Joint Pain — Paingesic Oil, Paingesic Spray, Pain Over Capsules, Vedic Plus Tablet
3. 🛡️ Immunity — Tulsi Paawan, Urja Rasayan, Daibayog (Sugar), Tulsi Supralas
4. 💪 Men's Health — Natural Shilajit, Gold Vitality Capsule, Essential Oil
5. ⚖️ Weight Loss — Weight Manage Capsule, Slim Fit Prash, SHAPE Slimming Formula
6. 🍵 Herbal Tea — Green Tea, 15-Herb Tea, 36-Herb Premium Tea
7. 🎁 Combo Kits — Joint+Varicose, Nadiyog+Oil, Nadiyog+Naskhol, Painover+Oil

USP:
- Pure Ayurvedic formulations (no chemicals)
- Results in 2-4 weeks (visible improvement)
- 3-6 months course for long-term results
- Doctor-formulated products
- Pan-India delivery with COD available
`.trim();

function sanitizeValue(val) {
    if (typeof val !== 'string') return '';
    return val.trim().replace(/^['"]|['"]$/g, '');
}

function resolveWebsiteBaseUrl(input) {
    try {
        const parsed = new URL(input);
        return `${parsed.protocol}//${parsed.host}`;
    } catch (e) {
        return 'https://www.herbonnaturals.com';
    }
}

function normalizePhoneForWhatsApp(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return '91' + digits;
    return digits;
}

function getMetaErrorSummary(err) {
    const error = err?.response?.data?.error;
    if (!error) return err?.message || 'Unknown Meta API error';
    const parts = [error.message];
    if (error.code) parts.push(`code=${error.code}`);
    if (error.error_data?.details) parts.push(error.error_data.details);
    return parts.filter(Boolean).join(' | ');
}

function getProductWebsiteLink(product) {
    const imageUrl = sanitizeValue(product.imageUrl || '');
    if (imageUrl.startsWith('/')) {
        return `${WEBSITE_BASE_URL}${imageUrl}`;
    }
    if (/^https?:\/\//i.test(imageUrl) && !/\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(imageUrl)) {
        return imageUrl;
    }
    return `${WEBSITE_BASE_URL}/search?q=${encodeURIComponent(product.name || '')}`;
}

function inferProductUseCase(product) {
    if (product.idealFor) return product.idealFor;
    const name = (product.name || '').toLowerCase();
    
    // Fallback logic
    if (name.includes('vedic capsule')) return 'immunity, fatigue, vitality';
    if (name.includes('paingesic')) return 'joint pain, arthritis, stiffness';
    if (name.includes('vena-v') || name.includes('naskhol')) return 'varicose veins, circulation';
    if (name.includes('shilajit')) return 'stamina, energy, strength';
    if (name.includes('weight manage')) return 'fat loss, metabolism';
    return 'Ayurvedic health support';
}

function inferHowToUse(product) {
    if (product.usage) return product.usage;
    const name = (product.name || '').toLowerCase();
    if (name.includes('capsule')) return '1-1 cap subah-shaam water/milk ke saath.';
    if (name.includes('oil')) return 'Halka massage din mein 2-3 baar.';
    return 'Directions mentioned on the pack.';
}

function buildPromptCatalog(products) {
    if (!products || products.length === 0) return 'Catalog empty.';
    return products.map((p) => {
        const benefits = (p.benefits || []).slice(0, 2).join(', ');
        return `• ${p.name} | ₹${p.price} | ${p.size || ''} ${p.bestSeller ? '⭐' : ''}
  🎯 Use: ${inferProductUseCase(p)}
  ✅ Benefits: ${benefits}
  🔗 ${getProductWebsiteLink(p)}`;
    }).join('\n');
}

function isProductImageRequest(text) {
    const t = (text || '').toLowerCase();
    return /(photo|image|pic|picture|img|dikhao|dikhaiye|show|link|photo bhejo|img bhej)/.test(t);
}

function scoreProductMatch(text, product) {
    const t = (text || '').toLowerCase();
    const fullName = (product.name || '').toLowerCase();
    let score = 0;
    if (fullName && t.includes(fullName)) score += 5;
    for (const tag of product.tags || []) {
        if (t.includes(String(tag).toLowerCase())) score += 1;
    }
    return score;
}

async function buildProductImageLinkReply(messageText, conv) {
    if (!isProductImageRequest(messageText)) return null;
    const products = await Product.find({ isActive: true }).sort({ bestSeller: -1 });
    if (!products.length) return null;

    const ranked = products
        .map((p) => ({ product: p, score: scoreProductMatch(messageText, p) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.product);

    const selected = (ranked.length > 0 ? ranked : products).slice(0, 3);
    const lines = selected.map((p, i) => `${i + 1}. ${p.name}: ${getProductWebsiteLink(p)}`).join('\n');

    return `Bilkul ji 📸 Product links yeh rahe:\n${lines}\n\nAap concern batayein, main best recommend kar doon 🙂\n\n[INTENT:QUESTION] [SENTIMENT:POSITIVE]`;
}

// ==================== PROMPT BUILDER ====================
async function buildSystemPrompt(customerProfile, productCatalog, discountInfo) {
    let prompt = `Tu hai "Aaditya" — Herb On Naturals ka Senior Ayurvedic Expert. 
🚨 RULES:
1. CHHOTA LIKH (Max 2-3 lines).
2. EMOJI 1-3 use kar naturally.
3. Warm professional Hinglish (ji/aap).
4. Price/Size hamesha batao.

BRAND: ${COMPANY_PROFILE}
CATALOG: ${productCatalog}

CONCERN MAPPING:
- Joint pain → Paingesic Oil ₹799 + Pain Over ₹960
- Varicose → Vena-V ₹1599 / Naskhol ₹1990
- Stamina → Shilajit ₹1499 / Gold Vitality ₹1299
- Weight loss → Weight Manage ₹960 / SHAPE ₹3300

CUSTOMER: ${customerProfile ? customerProfile.customerName : 'New lead'}
${discountInfo ? `OFFER: ${discountInfo}` : ''}

Format reply with [INTENT:XXX] [SENTIMENT:YYY] tags.`;
    return prompt;
}

// ==================== HELPERS ====================
async function getOrCreateProfile(phone, customerName) {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    let profile = await CustomerProfile.findOne({ phone: { $regex: cleanPhone } });
    if (!profile) {
        profile = await CustomerProfile.create({
            phone: cleanPhone,
            customerName: customerName || 'Customer',
            segment: 'New'
        });
    }
    return profile;
}

async function updateProfileAfterConversation(profile, conversation) {
    profile.totalConversations += 1;
    if (conversation.status === 'reordered') profile.totalReorders += 1;
    await profile.save();
}

function calculateDiscount(profile) {
    let discountPercent = 0, discountCode = '', discountMsg = '';
    if (profile.segment === 'VIP') {
        discountPercent = 15; discountCode = 'VIP15';
        discountMsg = 'VIP 15% Off (Code: VIP15)';
    } else if (profile.totalOrders >= 1) {
        discountPercent = 5; discountCode = 'WELCOME5';
        discountMsg = 'Loyal 5% Off (Code: WELCOME5)';
    }
    return { discountPercent, discountCode, discountMsg };
}

// ==================== CORE ACTIONS ====================
async function sendWhatsApp(phone, text) {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return { mock: true };
    const cleanPhone = normalizePhoneForWhatsApp(phone);
    try {
        await axios.post(GRAPH_URL, {
            messaging_product: 'whatsapp', to: cleanPhone, type: 'text', text: { body: text }
        }, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
        return { success: true };
    } catch (err) {
        // Fallback to hello_world template if window closed
        try {
            await axios.post(GRAPH_URL, {
                messaging_product: 'whatsapp', to: cleanPhone, type: 'template',
                template: { name: START_TEMPLATE_NAME, language: { code: START_TEMPLATE_LANG } }
            }, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
            return { success: true, type: 'template' };
        } catch (e) { throw e; }
    }
}

async function getAIResponse(messages) {
    if (!GROQ_API_KEY) return { content: 'Ji bilkul! [INTENT:QUESTION] [SENTIMENT:NEUTRAL]' };
    try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant', messages, max_tokens: 300, temperature: 0.6
        }, { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` } });
        return res.data.choices[0].message;
    } catch (err) {
        return { content: 'Ji, main samajh gaya. Aap batayein kaise madad kar sakta hoon?\n\n[INTENT:QUESTION] [SENTIMENT:NEUTRAL]' };
    }
}

function extractIntent(text) {
    const match = text.match(/\[INTENT:(\w+)\]/);
    return match ? match[1] : 'QUESTION';
}

function extractSentiment(text) {
    const match = text.match(/\[SENTIMENT:(\w+)\]/);
    return match ? match[1].toLowerCase() : 'neutral';
}

function cleanMessage(text) {
    return text.replace(/\[INTENT:.*?\]/g, '').replace(/\[SENTIMENT:.*?\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

// ==================== ENDPOINTS ====================
router.post('/bot/start', async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).send('Order not found');
        const phone = order.mobile || order.telNo;
        const profile = await getOrCreateProfile(phone, order.customerName);
        const products = await Product.find({ isActive: true });
        const discount = calculateDiscount(profile);
        const systemPrompt = await buildSystemPrompt(profile, buildPromptCatalog(products), discount.discountMsg);
        
        let initialMsg = `🌿 Namaste ${order.customerName} ji! Aapka order deliver ho chuka hai. Kaise lage products? 😊`;
        await sendWhatsApp(phone, initialMsg);

        await Conversation.create({
            phone: normalizePhoneForWhatsApp(phone),
            customerName: order.customerName,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'assistant', content: initialMsg }],
            status: 'active',
            customerProfileId: profile._id
        });

        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

router.post('/bot/webhook', handleMetaWebhookPost);
router.get('/bot/webhook', handleMetaWebhookVerify);

async function handleMetaWebhookPost(req, res) {
    const body = req.body;
    if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                if (change.value.messages) {
                    for (const msg of change.value.messages) {
                        const incoming = msg.text?.body || '';
                        if (incoming) await handleIncomingMessage(msg.from, incoming);
                    }
                }
            }
        }
    }
    res.sendStatus(200);
}

function handleMetaWebhookVerify(req, res) {
    const verifyToken = process.env.META_WA_WEBHOOK_VERIFY_TOKEN || 'salesagent_verify_123';
    if (req.query['hub.verify_token'] === verifyToken) return res.send(req.query['hub.challenge']);
    res.sendStatus(403);
}

// ==================== CORE HANDLER ====================
async function handleIncomingMessage(senderPhone, messageText, senderName) {
    const cleanPhone = senderPhone.replace(/\D/g, '').slice(-10);
    let conv = await Conversation.findOne({ phone: { $regex: cleanPhone }, status: 'active' }).sort({ lastMessageAt: -1 });

    if (!conv) {
        const profile = await getOrCreateProfile(senderPhone, senderName);
        const products = await Product.find({ isActive: true });
        const sys = await buildSystemPrompt(profile, buildPromptCatalog(products));
        conv = await Conversation.create({
            phone: senderPhone, customerName: senderName || 'Customer',
            messages: [{ role: 'system', content: sys }], status: 'active', customerProfileId: profile._id
        });
    }

    conv.messages.push({ role: 'user', content: messageText });
    const aiResponse = await getAIResponse(conv.messages.map(m => ({ role: m.role, content: m.content })));
    const responseText = aiResponse.content;
    const intent = extractIntent(responseText);
    const sentiment = extractSentiment(responseText);
    
    conv.messages.push({ role: 'assistant', content: responseText, sentiment });
    conv.lastMessageAt = new Date();

    // Check for Reorder intent
    if (intent === 'REORDER' && !conv.reorderCreated) {
        try {
            const reorderResult = await createAutoReorder(conv);
            if (reorderResult.success) {
                conv.status = 'reordered';
                conv.reorderCreated = true;
                conv.newOrderId = reorderResult.newOrderId;
                
                const confirmMsg = `✅ Aapka order confirm ho gaya hai! 🎉\n📦 Order ID: ${reorderResult.newOrderId}\n💰 Total: ₹${reorderResult.total}\n🚚 Delivery: COD. Jaldi hi dispatch hoga!`;
                await sendWhatsApp(senderPhone, confirmMsg);
                conv.messages.push({ role: 'assistant', content: confirmMsg, sentiment: 'positive' });
            }
        } catch (e) {
            console.error('Reorder creation failed:', e.message);
        }
    } else {
        await sendWhatsApp(senderPhone, cleanMessage(responseText));
    }

    await conv.save();
}

async function createAutoReorder(conv) {
    const originalOrder = conv.originalOrderMongoId ? await Order.findById(conv.originalOrderMongoId) : null;
    const newOrderId = 'WABOT-' + Date.now();
    const now = new Date().toISOString();

    // Default to a sample product if no history (should ideally come from AI extraction)
    let items = originalOrder?.items || [{ description: 'Ayurvedic Wellness Pack', quantity: 1, price: 999, rate: 999, amount: 999 }];
    let total = items.reduce((sum, i) => sum + i.amount, 0);

    if (conv.discountPercent > 0) total = Math.round(total * (1 - conv.discountPercent / 100));

    const newOrder = new Order({
        orderId: newOrderId,
        timestamp: now,
        employee: 'WhatsApp AI Bot',
        customerName: conv.customerName,
        mobile: conv.phone,
        address: originalOrder?.address || 'Address requested via chat',
        state: originalOrder?.state || 'N/A',
        total: total,
        codAmount: total,
        items: items,
        status: 'Pending'
    });
    await newOrder.save();

    await Reorder.create({
        reorderId: 'RO-' + Date.now(),
        originalOrderId: originalOrder?.orderId || 'NEW-LEAD',
        newOrderId: newOrderId,
        customerName: conv.customerName,
        mobile: conv.phone,
        items: items,
        total: total,
        source: 'WhatsApp AI'
    });

    return { success: true, newOrderId, total };
}

// ==================== SIMULATE ====================
router.post('/bot/simulate', async (req, res) => {
    const { phone, message } = req.body;
    await handleIncomingMessage(phone, message);
    const conv = await Conversation.findOne({ phone: { $regex: phone.slice(-10) } }).sort({ lastMessageAt: -1 });
    const last = conv.messages[conv.messages.length - 1];
    res.json({
        success: true,
        reply: cleanMessage(last.content),
        intent: extractIntent(last.content),
        sentiment: last.sentiment
    });
});

module.exports = router;
