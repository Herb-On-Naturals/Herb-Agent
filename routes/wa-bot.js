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
Website: https://www.herbonnaturals.com/
Brand: Herb On Naturals (Herbon Naturals)
Positioning: Ayurvedic and natural wellness products
Brand Promise:
- Pure nature focused products
- 100% natural ingredients
- No toxins / chemical-free approach
- Cruelty-free
- Lab-tested quality
Trust Signals Shared By Brand:
- FSSAI standards
- GMP certified manufacturing
- Organic/natural ingredient focus
- AYUSH-oriented wellness positioning
Core Concern Categories:
- Men's Health
- Weight Management
- Skin Care
- Daily Wellness
- Hair Care
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
    const name = (product.name || '').toLowerCase();
    const tags = (product.tags || []).join(' ').toLowerCase();
    const category = (product.category || '').toLowerCase();

    if (name.includes('anti-dandruff') || tags.includes('dandruff')) {
        return 'dandruff, itchy scalp aur scalp fungal issues support';
    }
    if (name.includes('hair oil') || tags.includes('hair') || category.includes('hair')) {
        return 'hair fall support, scalp nourishment aur hair strength';
    }
    if (name.includes('shampoo')) {
        return 'daily scalp cleansing, oil-control aur soft hair';
    }
    if (name.includes('conditioner')) {
        return 'frizz control, detangling aur damaged hair nourishment';
    }
    if (name.includes('face wash')) {
        return 'daily face cleansing, acne/oil-control support';
    }
    if (name.includes('face cream')) {
        return 'skin hydration, glow support aur anti-aging care';
    }
    if (name.includes('body lotion')) {
        return 'dry skin hydration aur body moisturization';
    }
    if (name.includes('aloe')) {
        return 'skin soothing, cooling and multi-purpose skin/hair care';
    }
    if (category.includes('combo') || name.includes('kit')) {
        return 'complete routine support for targeted care';
    }
    return 'general herbal wellness support as per product label';
}

function inferHowToUse(product) {
    const name = (product.name || '').toLowerCase();
    const category = (product.category || '').toLowerCase();

    if (name.includes('oil')) return 'Scalp/target area par lagakar halka massage, phir label instructions follow karein.';
    if (name.includes('shampoo') || name.includes('face wash')) return 'Pani se wet skin/hair par apply karke 30-60 sec gently massage karein, phir rinse karein.';
    if (name.includes('conditioner')) return 'Shampoo ke baad lengths par lagayein, 2-3 min rakhkar rinse karein.';
    if (name.includes('cream') || name.includes('lotion') || name.includes('gel')) return 'Clean skin par thin layer lagayein, day/night routine me label ke hisab se use karein.';
    if (category.includes('combo') || name.includes('kit')) return 'Routine order follow karein: cleanser -> treatment -> moisturizer/oil, product label ke hisab se.';
    return 'Product label pe diye gaye dosage/usage instructions ko follow karein.';
}

function buildPromptCatalog(products) {
    if (!products || products.length === 0) {
        return 'Catalog unavailable. User se concern lekar best available option suggest karo aur manual confirmation lo.';
    }

    return products.map((p) => {
        const off = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0;
        const benefits = (p.benefits || []).slice(0, 5).join(', ') || 'N/A';
        const ingredients = p.ingredients || 'N/A';
        return `• ${p.name} (${p.category || 'General'}) — ₹${p.price}${p.mrp ? ` (MRP ₹${p.mrp}, ${off}% off)` : ''} ${p.bestSeller ? '⭐' : ''}
  Best for: ${inferProductUseCase(p)}
  Benefits: ${benefits}
  Ingredients: ${ingredients}
  How to use: ${inferHowToUse(p)}
  Website Link: ${getProductWebsiteLink(p)}`;
    }).join('\n');
}

function isProductImageRequest(text) {
    const t = (text || '').toLowerCase();
    return /(photo|image|pic|picture|img|dikhao|dikhaiye|show|link|photo bhejo|img bhej)/.test(t);
}

function scoreProductMatch(text, product) {
    const t = (text || '').toLowerCase();
    const fullName = (product.name || '').toLowerCase();
    const strippedName = fullName
        .replace(/\b(herb|herbon|on|naturals?)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    let score = 0;

    if (fullName && t.includes(fullName)) score += 5;
    if (strippedName && t.includes(strippedName)) score += 3;

    const category = (product.category || '').toLowerCase();
    if (category && t.includes(category.split(' ')[0])) score += 1;

    for (const tag of product.tags || []) {
        const tagText = String(tag || '').toLowerCase().trim();
        if (tagText && t.includes(tagText)) score += 1;
    }

    for (const token of strippedName.split(' ').filter(x => x.length >= 4)) {
        if (t.includes(token)) score += 1;
    }

    return score;
}

function buildImageRequestContextText(messageText, conv) {
    const recentUserMessages = (conv?.messages || [])
        .filter((m) => m.role === 'user')
        .slice(-4)
        .map((m) => m.content || '')
        .join(' ');
    return `${recentUserMessages} ${messageText || ''}`.trim();
}

async function buildProductImageLinkReply(messageText, conv) {
    if (!isProductImageRequest(messageText)) return null;

    const products = await Product.find({ isActive: true }).sort({ bestSeller: -1 });
    if (!products.length) {
        return 'Bilkul ji 🙂 Abhi catalog update ho raha hai. Aap concern batayein, main best option suggest kar deta hoon.\n\n[INTENT:QUESTION] [SENTIMENT:NEUTRAL]';
    }

    const contextText = buildImageRequestContextText(messageText, conv);
    const ranked = products
        .map((p) => ({ product: p, score: scoreProductMatch(contextText, p) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.product);

    const selected = (ranked.length > 0 ? ranked : products).slice(0, 3);
    const lines = selected
        .map((p, i) => `${i + 1}. ${p.name}: ${getProductWebsiteLink(p)}`)
        .join('\n');

    return `Bilkul ji 📸 Product links yeh rahe:\n${lines}\n\nAgar aap chahein to main inme se best option recommend bhi kar doon 🙂\n\n[INTENT:QUESTION] [SENTIMENT:POSITIVE]`;
}

// ==================== BUILD DYNAMIC SYSTEM PROMPT ====================
async function buildSystemPrompt(customerProfile, productCatalog, discountInfo) {
    let prompt = `You are "Aaditya", a Senior Health Expert and customer consultant for Herb Agent at Herb On Naturals.
Your job is to guide customers on product usage, solve wellness questions, and help them reorder confidently on WhatsApp.

BRAND KNOWLEDGE (SOURCE OF TRUTH):
${COMPANY_PROFILE}

VOICE, TONE, STYLE:
- Professional Hinglish (clear Hindi + simple English)
- Respectful and expert tone: always use "aap" and "ji"
- Keep replies concise (2-4 short lines)
- Add 1-3 relevant emojis naturally in each reply (avoid emoji spam)
- Sound like a senior health expert, not a generic bot

PRODUCT KNOWLEDGE (USE THIS ONLY):
${productCatalog}

HEALTH GUIDANCE RULES:
1. If customer asks "ye kis cheez me use hota hai?" then explain:
   - condition/use-case
   - expected support/benefit
   - simple usage guidance
2. Never claim guaranteed cure or instant permanent result.
3. For severe/persistent symptoms, politely suggest consulting a doctor.
4. Stay truthful to known catalog details (benefits/ingredients/category/pricing).

SALES & ORDER RULES:
1. FEEDBACK: Ask about previous experience first.
2. CONSULTATION: Recommend products based on concern + profile.
3. REORDERING: Before final confirmation, always show cart summary (item, qty, total) and ask:
   "Kya main ye order confirm kar doon?"
4. ORDER MODIFICATION: If cart changes, append JSON exactly:
   [CART_UPDATE: {"items": [{"name": "Product Name", "quantity": 1, "price": 500}]}]
5. Use [INTENT:REORDER] only after explicit customer confirmation.

DYNAMIC CUSTOMER CONTEXT:
${customerProfile ? `
- Customer Name: ${customerProfile.customerName}
- Segment: ${customerProfile.segment}
- Preferred Products: ${(customerProfile.preferredProducts || []).join(', ') || 'N/A'}
- Loyalty: ${customerProfile.totalOrders} previous orders
` : ''}
${discountInfo ? `\nSPECIAL OFFER: ${discountInfo}` : ''}

INTENT & SENTIMENT TAGS (MANDATORY IN EVERY REPLY):
- [INTENT:REORDER] | [INTENT:MODIFY_ORDER] | [INTENT:QUESTION] | [INTENT:INTERESTED] | [INTENT:NOT_INTERESTED]
- [SENTIMENT:POSITIVE] | [SENTIMENT:NEUTRAL] | [SENTIMENT:NEGATIVE]

Output format:
"Aapka visible reply with emojis... [INTENT:XXX] [SENTIMENT:YYY]"`;

    return prompt;
}

// ==================== CUSTOMER PROFILE HELPERS ====================
async function getOrCreateProfile(phone, customerName) {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    let profile = await CustomerProfile.findOne({ phone: { $regex: cleanPhone } });

    if (!profile) {
        // Build profile from order history
        const orders = await Order.find({
            $or: [
                { mobile: { $regex: cleanPhone } },
                { telNo: { $regex: cleanPhone } }
            ],
            status: 'Delivered'
        }).sort({ createdAt: -1 });

        const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const avgOrder = orders.length > 0 ? Math.round(totalSpent / orders.length) : 0;

        // Extract preferred products
        const productMap = {};
        orders.forEach(o => {
            (o.items || []).forEach(item => {
                const name = item.description || item.treatment || '';
                if (name) productMap[name] = (productMap[name] || 0) + 1;
            });
        });
        const preferredProducts = Object.entries(productMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name);

        // Determine segment
        let segment = 'New';
        if (orders.length >= 5) segment = 'VIP';
        else if (orders.length >= 2) segment = 'Regular';
        else if (orders.length === 1) segment = 'New';

        // Check if inactive (no order in 90 days)
        if (orders.length > 0) {
            const lastDate = orders[0].deliveredAt || orders[0].createdAt;
            if (lastDate) {
                const daysSince = (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSince > 180) segment = 'Lost';
                else if (daysSince > 90) segment = 'Inactive';
            }
        }

        profile = await CustomerProfile.create({
            phone: cleanPhone,
            customerName: customerName || 'Customer',
            totalOrders: orders.length,
            totalSpent,
            avgOrderValue: avgOrder,
            lastOrderDate: orders.length > 0 ? orders[0].createdAt : null,
            firstOrderDate: orders.length > 0 ? orders[orders.length - 1].createdAt : null,
            preferredProducts,
            segment,
            preferredPayment: orders[0]?.paymentMode || 'COD'
        });

        console.log(`👤 New customer profile created: ${customerName} [${segment}] — ${orders.length} orders, ₹${totalSpent} spent`);
    }

    return profile;
}

async function updateProfileAfterConversation(profile, conversation) {
    profile.totalConversations += 1;
    if (conversation.status === 'reordered') {
        profile.totalReorders += 1;
    }
    profile.conversionRate = profile.totalConversations > 0
        ? Math.round((profile.totalReorders / profile.totalConversations) * 100)
        : 0;
    profile.lastSentiment = conversation.overallSentiment || 'neutral';
    await profile.save();
}

// ==================== SMART DISCOUNT LOGIC ====================
function calculateDiscount(profile) {
    let discountPercent = 0;
    let discountCode = '';
    let discountMsg = '';

    if (profile.segment === 'VIP') {
        discountPercent = 15;
        discountCode = 'VIP15';
        discountMsg = `Tu is VIP customer ko 15% discount de sakta hai (code: VIP15). Yeh bahut purana aur valuable customer hai.`;
    } else if (profile.segment === 'Inactive' || profile.segment === 'Lost') {
        discountPercent = 20;
        discountCode = 'COMEBACK20';
        discountMsg = `Tu is customer ko 20% special comeback discount de sakta hai (code: COMEBACK20). Bahut time se order nahi kiya hai.`;
    } else if (profile.totalOrders >= 3) {
        discountPercent = 10;
        discountCode = 'LOYAL10';
        discountMsg = `Tu is loyal customer ko 10% discount de sakta hai (code: LOYAL10). 3+ baar order kiya hai.`;
    } else if (profile.totalOrders >= 1) {
        discountPercent = 5;
        discountCode = 'WELCOME5';
        discountMsg = `Tu is customer ko 5% welcome-back discount de sakta hai (code: WELCOME5).`;
    }

    // Don't give another discount if given recently
    if (profile.lastDiscountDate) {
        const daysSince = (Date.now() - new Date(profile.lastDiscountDate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) {
            discountMsg += '\n⚠️ Recently discount diya hai, dusra mat dena abhi.';
        }
    }

    return { discountPercent, discountCode, discountMsg };
}

// ==================== SEND WHATSAPP ====================
async function sendWhatsApp(phone, text) {
    const fs = require('fs');
    const logFile = 'whatsapp_debug.log';
    const log = (msg) => fs.appendFile(logFile, `[${new Date().toISOString()}] ${msg}\n`, () => { });

    log(`📱 Attempting WhatsApp send to ${phone}. ID: ${PHONE_NUMBER_ID ? 'YES' : 'NO'}, Key: ${ACCESS_TOKEN ? 'YES' : 'NO'}`);

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
        log(`📱 [MOCK BOT] → ${phone}: ${text.substring(0, 80)}...`);
        return { mock: true };
    }

    const cleanPhone = normalizePhoneForWhatsApp(phone);
    if (!cleanPhone) {
        throw new Error('Invalid recipient phone number');
    }

    // 1. Try sending as plain text (Works if user messaged first or within 24h)
    log(`📱 Sending live TEXT message via Meta to ${cleanPhone}...`);
    try {
        const res = await axios.post(GRAPH_URL, {
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: text }
        }, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' }
        });

        log(`✅ TEXT Success: ${res.data.messages?.[0]?.id}`);
        return { messageId: res.data.messages?.[0]?.id, phone: cleanPhone };
    } catch (err) {
        log(`⚠️ TEXT Failed: ${getMetaErrorSummary(err)}. Attempting Template Fallback...`);

        // 2. Fallback to Template Message (Works for initial contact/outside 24h)
        try {
            const templateRes = await axios.post(GRAPH_URL, {
                messaging_product: 'whatsapp',
                to: cleanPhone,
                type: 'template',
                template: {
                    name: START_TEMPLATE_NAME,
                    language: { code: START_TEMPLATE_LANG }
                }
            }, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' }
            });

            log(`✅ TEMPLATE Success: ${templateRes.data.messages?.[0]?.id}`);
            return { messageId: templateRes.data.messages?.[0]?.id, phone: cleanPhone, type: 'template_fallback' };
        } catch (templateErr) {
            log(`❌ TEMPLATE Failed: ${getMetaErrorSummary(templateErr)}`);
            log(`❌ Error Details: ${JSON.stringify(templateErr.response?.data || {})}`);
            throw templateErr;
        }
    }
}

// ==================== GROQ AI CHAT ====================
async function getAIResponse(messages) {
    if (!GROQ_API_KEY) {
        return { content: 'Ji bilkul! Aapka order phir se bhej dein? Same items same address pe?\n\n[INTENT:INTERESTED] [SENTIMENT:POSITIVE]' };
    }

    try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            max_tokens: 400,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return res.data.choices[0].message;
    } catch (err) {
        console.error('❌ Groq AI error:', err.response?.data || err.message);
        return { content: 'Ji, main samajh gaya. Aap batayein kaise madad kar sakta hoon?\n\n[INTENT:QUESTION] [SENTIMENT:NEUTRAL]' };
    }
}

// Extract intent from AI response
function extractIntent(text) {
    const match = text.match(/\[INTENT:(\w+)\]/);
    return match ? match[1] : 'QUESTION';
}

// Extract sentiment from AI response
function extractSentiment(text) {
    const match = text.match(/\[SENTIMENT:(\w+)\]/);
    return match ? match[1].toLowerCase() : 'neutral';
}

// Remove intent + sentiment tags from visible message
function cleanMessage(text) {
    return text.replace(/\n?\[INTENT:\w+\]/g, '').replace(/\n?\[SENTIMENT:\w+\]/g, '').trim();
}

// ==================== START CONVERSATION ====================
router.post('/bot/start', async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) return res.status(400).json({ success: false, message: 'orderId required' });

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const phone = order.mobile || order.telNo;
        if (!phone) return res.status(400).json({ success: false, message: 'No phone on order' });

        const cleanPhone = normalizePhoneForWhatsApp(phone);
        if (!cleanPhone) return res.status(400).json({ success: false, message: 'Invalid phone on order' });

        // Check for existing active conversation
        let conv = await Conversation.findOne({ phone: { $regex: cleanPhone.slice(-10) }, status: 'active' });
        if (conv) {
            return res.json({ success: true, message: 'Conversation already active', conversationId: conv._id });
        }

        // Get/create customer profile
        const profile = await getOrCreateProfile(cleanPhone, order.customerName);

        // Load product catalog
        const products = await Product.find({ isActive: true }).sort({ bestSeller: -1 });
        const catalogStr = products.map(p => {
            const off = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0;
            return `• ${p.name} — ₹${p.price}${p.mrp ? ` (MRP ₹${p.mrp}, ${off}% off)` : ''} ${p.bestSeller ? '⭐' : ''}\n  ${(p.benefits || []).slice(0, 3).join(', ')}`;
        }).join('\n');

        // Calculate discount
        const discount = calculateDiscount(profile);

        // Build dynamic system prompt
        const systemPrompt = await buildSystemPrompt(profile, buildPromptCatalog(products), discount.discountMsg);

        // Build initial message
        const items = (order.items || []).map(i => i.description || i.treatment || 'Product').join(', ');
        let initialMsg = `🌿 Namaste ${order.customerName || ''} ji!\n\nMain Herbon Naturals se bol raha hoon. Aapka order (${items}) successfully deliver ho chuka hai.\n\nAapko products kaise lage? Kya aap dobara order karna chahenge? 😊`;

        // Add personalized touch based on segment
        if (profile.segment === 'VIP') {
            initialMsg += '\n\n⭐ Aap humare VIP customer hain! Aapke liye special offers available hain! 🎁';
        } else if (profile.segment === 'Inactive') {
            initialMsg += '\n\nBahut din ho gaye aapko miss kar rahe the! Aapke liye special comeback offer hai! 🎁';
        } else if (discount.discountPercent > 0) {
            initialMsg += `\n\nHum aapke liye ${discount.discountPercent}% special discount bhi de sakte hain! 🎁`;
        }

        // 3. SEND TEMPLATE MESSAGE (Force 'hello_world' for Sandbox/First Contact)
        // Sandbox restricts plain text initiation unlike Production. 
        // We send 'hello_world' to open the 24h window.
        console.log(`🚀 Starting Conversation with TEMPLATE (Sandbox Rule) for ${cleanPhone}`);

        let sendResult = { mock: false, failed: false };
        try {
            const templateRes = await axios.post(GRAPH_URL, {
                messaging_product: 'whatsapp',
                to: cleanPhone,
                type: 'template',
                template: {
                    name: START_TEMPLATE_NAME,
                    language: { code: START_TEMPLATE_LANG }
                }
            }, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' }
            });

            console.log(`✅ Template Outreach Sent! ID: ${templateRes.data.messages?.[0]?.id}`);
            sendResult.messageId = templateRes.data.messages?.[0]?.id;
        } catch (sendErr) {
            const errorMsg = getMetaErrorSummary(sendErr);
            console.log(`⚠️ Template start failed for ${order.customerName}: ${errorMsg}`);

            const fs = require('fs');
            const errorLog = `[${new Date().toISOString()}] Template Start Failed: ${errorMsg}\n` +
                (sendErr.response?.data ? JSON.stringify(sendErr.response.data, null, 2) + '\n' : '');
            fs.appendFile('whatsapp_errors.log', errorLog, () => { });
            sendResult.failed = true;
        }

        // Schedule first follow-up (24 hours)
        const followUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create conversation
        conv = await Conversation.create({
            phone: cleanPhone,
            customerName: order.customerName,
            originalOrderId: order.orderId,
            originalOrderMongoId: order._id.toString(),
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'assistant', content: initialMsg + '\n\n[INTENT:INTERESTED] [SENTIMENT:POSITIVE]' }
            ],
            status: 'active',
            discountOffered: discount.discountCode,
            discountPercent: discount.discountPercent,
            customerProfileId: profile._id,
            followUpAt
        });

        // Update profile
        profile.totalConversations += 1;
        await profile.save();

        console.log(`🤖 Bot conversation started with ${order.customerName} (${cleanPhone}) [${profile.segment}]`);

        const mode = sendResult.failed ? 'failed_to_send' : sendResult.mock ? 'mock' : 'live';

        res.json({
            success: true,
            message: `AI conversation started with ${order.customerName}${sendResult.failed ? ' (WhatsApp send failed — use simulate)' : ''}`,
            conversationId: conv._id,
            mode,
            customerSegment: profile.segment,
            discountCode: discount.discountCode
        });
    } catch (err) {
        console.error('❌ Bot start error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== WEBHOOK ====================
// Verify Meta webhook signature
function verifyWebhookSignature(req) {
    const appSecret = sanitizeValue(
        process.env.META_WEBHOOK_APP_SECRET ||
        process.env.META_APP_SECRET ||
        ''
    );
    if (!appSecret) return { verified: true, reason: 'app_secret_not_configured' };

    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return { verified: false, reason: 'missing_signature_header' };

    const rawBody = req.rawBody || JSON.stringify(req.body || {});
    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
        return { verified: false, reason: 'signature_length_mismatch' };
    }

    const verified = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    return { verified, reason: verified ? 'ok' : 'signature_mismatch' };
}

function extractIncomingText(message) {
    if (!message) return '';
    if (message.type === 'text') return message.text?.body || '';
    if (message.type === 'button') return message.button?.text || message.button?.payload || '';
    if (message.type === 'interactive') {
        return message.interactive?.button_reply?.title ||
            message.interactive?.list_reply?.title ||
            message.interactive?.nfm_reply?.body ||
            '';
    }
    if (message.type === 'image') return 'Customer ne image bheji hai. Image ke context me help karo.';
    if (message.type === 'audio') return 'Customer ne voice note bheja hai. Unse politely text me sawaal pucho.';
    if (message.type === 'video') return 'Customer ne video bheja hai. Video ke context me madad offer karo.';
    if (message.type === 'document') return 'Customer ne document bheja hai. Unse relevant details text me pucho.';
    if (message.type === 'sticker') return 'Customer ne sticker bheja hai. Friendly greeting ke saath reply karo.';
    return '';
}

async function handleMetaWebhookPost(req, res) {
    try {
        console.log(`🔔 Received Webhook POST from ${req.ip}`);
        const signatureCheck = verifyWebhookSignature(req);
        if (!signatureCheck.verified) {
            console.warn(`❌ Invalid webhook signature (${signatureCheck.reason})`);
            if (ENFORCE_SIGNATURE) {
                return res.sendStatus(401);
            }
            console.warn('⚠️ META_ENFORCE_SIGNATURE=false, continuing without strict signature enforcement.');
        }
        console.log(`✅ Webhook signature verified (${signatureCheck.reason})`);

        const body = req.body;
        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    if (change.field === 'messages' && change.value?.messages) {
                        for (const message of change.value.messages) {
                            const incomingText = extractIncomingText(message).trim();
                            const senderName = change.value.contacts?.[0]?.profile?.name;
                            if (incomingText && message.from) {
                                await handleIncomingMessage(message.from, incomingText, senderName);
                            }
                        }
                    }
                }
            }
        }
        res.sendStatus(200);
    } catch (err) {
        console.error('Bot webhook error:', err.message);
        res.sendStatus(200);
    }
}

function handleMetaWebhookVerify(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    const verifyToken = sanitizeValue(
        process.env.META_WEBHOOK_VERIFY_TOKEN ||
        process.env.META_WA_WEBHOOK_VERIFY_TOKEN ||
        process.env.META_WEBHOOK_SECRET ||
        'salesagent_verify_123'
    );

    console.log(`🔍 Webhook Verification Attempt: Mode=${mode}, Token=${token}, Expected=${verifyToken}`);

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ Webhook verified successfully');
        return res.status(200).send(challenge);
    }
    
    console.error(`❌ Webhook verification failed. Token mismatch or missing params.`);
    res.sendStatus(403);
}

// Keep both paths for compatibility: /api/bot/webhook and /api/whatsapp/webhook
router.post('/bot/webhook', handleMetaWebhookPost);
router.post('/whatsapp/webhook', handleMetaWebhookPost);
router.get('/bot/webhook', handleMetaWebhookVerify);
router.get('/whatsapp/webhook', handleMetaWebhookVerify);

// ==================== HANDLE INCOMING MESSAGE ====================
async function handleIncomingMessage(senderPhone, messageText, senderName) {
    const cleanPhone = senderPhone.replace(/\D/g, '');
    const last10 = cleanPhone.slice(-10);

    let conv = await Conversation.findOne({
        phone: { $regex: last10 },
        status: { $in: ['active', 'interested'] }
    }).sort({ lastMessageAt: -1 });

    if (!conv) {
        console.log(`New inbound message from ${cleanPhone} - creating conversation`);

        // Auto-onboard new inbound WhatsApp leads (not just existing order contacts)
        const profile = await getOrCreateProfile(cleanPhone, senderName || 'Customer');
        const products = await Product.find({ isActive: true }).sort({ bestSeller: -1 });
        const catalogStr = products.map(p => {
            const off = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0;
            return `- ${p.name} - Rs.${p.price}${p.mrp ? ` (MRP Rs.${p.mrp}, ${off}% off)` : ''} ${p.bestSeller ? '*' : ''}\n  ${(p.benefits || []).slice(0, 3).join(', ')}`;
        }).join('\n');

        const discount = calculateDiscount(profile);
        const systemPrompt = await buildSystemPrompt(profile, buildPromptCatalog(products), discount.discountMsg);

        conv = await Conversation.create({
            phone: cleanPhone,
            customerName: senderName || profile.customerName || 'Customer',
            messages: [
                { role: 'system', content: systemPrompt }
            ],
            status: 'active',
            discountOffered: discount.discountCode,
            discountPercent: discount.discountPercent,
            customerProfileId: profile._id,
            lastMessageAt: new Date()
        });

        profile.totalConversations += 1;
        await profile.save();
    }

    console.log(`Bot received from ${conv.customerName} (${cleanPhone}): "${messageText}"`);

    // Add user message
    conv.messages.push({ role: 'user', content: messageText });
    conv.lastMessageAt = new Date();

    // Cancel pending follow-up (customer replied!)
    conv.followUpAt = null;

    // If customer asks for product image/photo, return website product links directly.
    const imageLinkReply = await buildProductImageLinkReply(messageText, conv);

    // Get AI response
    const aiMessages = conv.messages.map(m => ({ role: m.role, content: m.content }));
    const aiResponse = imageLinkReply ? { content: imageLinkReply } : await getAIResponse(aiMessages);
    const responseText = aiResponse.content || 'Ji, main samajh gaya.';
    const intent = extractIntent(responseText);
    const sentiment = extractSentiment(responseText);
    const cleanedResponse = cleanMessage(responseText);

    // Add AI response with sentiment
    conv.messages.push({ role: 'assistant', content: responseText, sentiment });

    // Update conversation sentiment
    conv.overallSentiment = sentiment;
    const sentimentScores = { positive: 1, neutral: 0, negative: -1 };
    const allSentiments = conv.messages.filter(m => m.sentiment).map(m => sentimentScores[m.sentiment] || 0);
    conv.sentimentScore = allSentiments.length > 0
        ? parseFloat((allSentiments.reduce((a, b) => a + b, 0) / allSentiments.length).toFixed(2))
        : 0;

    console.log(`🤖 Bot reply to ${conv.customerName}: "${cleanedResponse.substring(0, 80)}..." [${intent}] [${sentiment}]`);

    // 1. EXTRACT CART UPDATES (JSON)
    const cartMatch = responseText.match(/\[CART_UPDATE:\s*({.*?})\]/);
    if (cartMatch) {
        try {
            const cartData = JSON.parse(cartMatch[1]);
            if (cartData.items && Array.isArray(cartData.items)) {
                conv.modifiedCart = cartData.items.map(item => ({
                    productId: item.productId || 'custom',
                    name: item.name,
                    quantity: item.quantity || 1,
                    price: item.price || 0
                }));
                console.log(`🛒 Cart modified via AI JSON: ${JSON.stringify(conv.modifiedCart)}`);
            }
        } catch (e) {
            console.error('❌ Failed to parse AI cart JSON:', e.message);
        }
    }

    // Handle intents
    if (intent === 'REORDER' && !conv.reorderCreated) {
        // Only if confirmed after suggestion
        const lastMsgs = conv.messages.filter(m => m.role === 'assistant').slice(-2);
        const hasSuggested = lastMsgs.some(m => m.content.includes('order confirm') || m.content.includes('order bhej') || m.content.includes('dhanyavaad'));

        // FOR NOW: Let's follow the simple intent, but make it more robust in the prompt
        try {
            const reorderResult = await createAutoReorder(conv);
            if (reorderResult.success) {
                conv.status = 'reordered';
                conv.reorderCreated = true;
                conv.newOrderId = reorderResult.newOrderId;

                const confirmMsg = `✅ ${conv.customerName} ji, aapka order confirm ho gaya hai! 🎉\n\n📦 Order ID: ${reorderResult.newOrderId}\n💰 Total: ₹${reorderResult.total}${conv.discountPercent > 0 ? ` (${conv.discountPercent}% discount applied!)` : ''}\n🚚 Delivery: COD (Cash on Delivery)\n\nJaldi hi aapko dispatch kar diya jayega. Dhanyavaad! 🙏`;
                try { await sendWhatsApp(senderPhone, confirmMsg); } catch (e) { console.log('⚠️ WA confirm send failed:', e.message); }

                conv.messages.push({ role: 'assistant', content: confirmMsg, sentiment: 'positive' });
                await conv.save();

                // (Profile update logic remains same below)

                // Update customer profile
                try {
                    const profile = await CustomerProfile.findById(conv.customerProfileId);
                    if (profile) {
                        await updateProfileAfterConversation(profile, conv);
                        // Record discount usage
                        if (conv.discountPercent > 0) {
                            profile.discountsGiven += 1;
                            profile.totalDiscountAmount += Math.round(reorderResult.total * conv.discountPercent / 100);
                            profile.lastDiscountDate = new Date();
                            await profile.save();
                        }
                    }
                } catch (e) { console.log('⚠️ Profile update failed:', e.message); }

                console.log(`🎉 AUTO-REORDER created for ${conv.customerName}! New Order: ${reorderResult.newOrderId}`);
                return;
            }
        } catch (reorderErr) {
            console.error('❌ Auto-reorder failed:', reorderErr.message);
        }
    } else if (intent === 'INTERESTED') {
        conv.status = 'interested';
        // Schedule follow-up in 24hrs
        conv.followUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (intent === 'NOT_INTERESTED') {
        conv.status = 'not_interested';
        conv.followUpAt = null;
    } else if (intent === 'MODIFY_ORDER') {
        // Customer wants to modify — keep active, let AI handle
        conv.status = 'interested';
    } else if (intent === 'CALLBACK') {
        conv.followUpAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // Follow up in 4 hours
    }

    // Handle negative sentiment
    if (sentiment === 'negative') {
        console.log(`⚠️ Negative sentiment detected from ${conv.customerName}!`);
    }

    await conv.save();

    // Send AI response via WhatsApp
    try { await sendWhatsApp(senderPhone, cleanedResponse); } catch (e) { console.log('⚠️ WA reply send failed:', e.message); }
}

// ==================== AUTO-CREATE REORDER ====================
async function createAutoReorder(conv) {
    const originalOrder = conv.originalOrderMongoId
        ? await Order.findById(conv.originalOrderMongoId)
        : null;

    const newOrderId = 'WABOT-' + Date.now();
    const now = new Date().toISOString();

    // Use modified cart if customer changed items, otherwise original items
    let items = originalOrder?.items || [];
    let total = originalOrder?.total || 0;

    if (conv.modifiedCart && conv.modifiedCart.length > 0) {
        items = conv.modifiedCart.map(item => ({
            description: item.name,
            quantity: item.quantity,
            price: item.price,
            rate: item.price,
            amount: item.quantity * item.price
        }));
        total = items.reduce((sum, i) => sum + i.amount, 0);
    }

    // For new customers without order history, cart must come from AI/cart updates.
    if (!items || items.length === 0) {
        throw new Error('No items available to create reorder');
    }

    // Apply discount
    if (conv.discountPercent > 0) {
        const discountAmount = Math.round(total * conv.discountPercent / 100);
        total = total - discountAmount;
    }

    const customerName = originalOrder?.customerName || conv.customerName || 'Customer';
    const customerPhone = originalOrder?.mobile || originalOrder?.telNo || conv.phone || '';
    const baseAddress = originalOrder?.address || 'Address pending';
    const baseState = originalOrder?.state || 'N/A';
    const sourceOrderLabel = originalOrder?.orderId || 'new-inbound-lead';

    const newOrder = new Order({
        orderId: newOrderId,
        timestamp: now,
        employee: 'WhatsApp AI Bot',
        employeeId: 'WABOT',
        customerName: customerName,
        telNo: originalOrder?.telNo || customerPhone,
        mobile: originalOrder?.mobile || customerPhone,
        altNo: originalOrder?.altNo || '',
        address: baseAddress,
        hNo: originalOrder?.hNo || '',
        villColony: originalOrder?.villColony || '',
        landmark: originalOrder?.landmark || originalOrder?.landMark || '',
        city: originalOrder?.city || '',
        state: baseState,
        pin: originalOrder?.pin || '',
        pincode: originalOrder?.pincode || originalOrder?.pin || '',
        distt: originalOrder?.distt || '',
        orderType: originalOrder ? 'WhatsApp AI Reorder' : 'WhatsApp AI New Lead',
        date: now.split('T')[0],
        time: now.split('T')[1]?.substring(0, 5),
        treatment: originalOrder?.treatment || '',
        paymentMode: originalOrder?.paymentMode || 'COD',
        total: total,
        codAmount: total,
        items: items,
        status: 'Pending',
        remarks: [{
            text: `Auto-reorder via WhatsApp AI Bot from ${sourceOrderLabel}${conv.discountPercent > 0 ? ` (${conv.discountPercent}% discount applied, code: ${conv.discountOffered})` : ''}`,
            addedBy: 'WhatsApp AI Bot',
            addedAt: now,
            timestamp: now
        }]
    });

    await newOrder.save();

    await Reorder.create({
        reorderId: 'RO-' + Date.now(),
        originalOrderId: originalOrder?.orderId || 'NEW-LEAD',
        newOrderId: newOrderId,
        customerName: customerName,
        mobile: customerPhone,
        address: baseAddress,
        state: baseState,
        items: items,
        total: total,
        paymentMode: originalOrder?.paymentMode || 'COD',
        source: 'WhatsApp AI',
        status: 'Created'
    });

    return { success: true, newOrderId, total };
}

// ==================== SIMULATE ====================
router.post('/bot/simulate', async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) return res.status(400).json({ success: false, message: 'phone and message required' });

        await handleIncomingMessage(phone, message);

        const cleanPhone = phone.replace(/\D/g, '');
        const conv = await Conversation.findOne({
            phone: { $regex: cleanPhone.slice(-10) }
        }).sort({ lastMessageAt: -1 });

        const lastBotMsg = conv?.messages?.filter(m => m.role === 'assistant').pop();

        res.json({
            success: true,
            reply: lastBotMsg ? cleanMessage(lastBotMsg.content) : 'No reply',
            intent: lastBotMsg ? extractIntent(lastBotMsg.content) : 'UNKNOWN',
            sentiment: lastBotMsg?.sentiment || 'neutral',
            conversationStatus: conv?.status,
            reorderCreated: conv?.reorderCreated || false,
            newOrderId: conv?.newOrderId,
            discountCode: conv?.discountOffered,
            discountPercent: conv?.discountPercent
        });
    } catch (err) {
        console.error('❌ Simulate error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET CONVERSATIONS ====================
router.get('/bot/conversations', async (req, res) => {
    try {
        const convs = await Conversation.find()
            .sort({ lastMessageAt: -1 })
            .limit(50)
            .select('-messages');

        res.json({ success: true, conversations: convs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET SINGLE CONVERSATION ====================
router.get('/bot/conversations/:id', async (req, res) => {
    try {
        const conv = await Conversation.findById(req.params.id);
        if (!conv) return res.status(404).json({ success: false, message: 'Not found' });

        const cleanMsgs = conv.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role,
                content: cleanMessage(m.content),
                sentiment: m.sentiment,
                timestamp: m.timestamp
            }));

        res.json({
            success: true,
            conversation: {
                ...conv.toObject(),
                messages: cleanMsgs
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET CUSTOMER PROFILES ====================
router.get('/bot/customers', async (req, res) => {
    try {
        const customers = await CustomerProfile.find()
            .sort({ totalSpent: -1 })
            .limit(100);
        res.json({ success: true, customers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
