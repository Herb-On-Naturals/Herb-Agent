const express = require('express');
const router = express.Router();
const axios = require('axios');
const { CallLog, Campaign, Order, Reorder, CustomerProfile, Product } = require('../models');

const BLAND_API_URL = 'https://api.bland.ai/v1/calls';

// ==================== BUILD CALL SCRIPT ====================
async function buildCallScript(customerName, items, order) {
    // Load customer profile
    const phone = order?.mobile || order?.telNo || '';
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    let profile = null;
    let discount = { percent: 0, code: '' };

    try {
        profile = await CustomerProfile.findOne({ phone: { $regex: cleanPhone } });
    } catch (e) { }

    // Load product catalog
    let productList = '';
    try {
        const products = await Product.find({ isActive: true, bestSeller: true }).limit(5);
        productList = products.map(p => `${p.name} (₹${p.price})`).join(', ');
    } catch (e) { }

    // Calculate discount
    if (profile) {
        if (profile.segment === 'VIP') { discount = { percent: 15, code: 'VIP15' }; }
        else if (profile.segment === 'Inactive' || profile.segment === 'Lost') { discount = { percent: 20, code: 'COMEBACK20' }; }
        else if (profile.totalOrders >= 3) { discount = { percent: 10, code: 'LOYAL10' }; }
        else if (profile.totalOrders >= 1) { discount = { percent: 5, code: 'WELCOME5' }; }
    }

    let script = `You are "Aaditya", a dedicated and polite Senior Sales & Support Agent from Herbon Naturals.
Your objective is to follow up with ${customerName} regarding their recent order of ${items || 'herbal products'}.

CORE OPERATING INSTRUCTIONS:
1. ACTIVE LISTENING: Pay close attention to what the customer says. If they mention a specific result or a concern, acknowledge it explicitly (e.g., "Achha, toh aapko ashwagandha se neend acchi aa rahi hai, ye sunkar khushi hui").
2. EMPATHY & RESPECT: Always use "ji" and "aap". If they had a bad experience, apologize sincerely and offer help before trying to sell.
3. GOAL-ORIENTED: Your primary goal is feedback, and secondary is a reorder.

YOUR STYLE:
- Professional Hinglish: Use a mix of formal Hindi and clear English.
- Natural Flow: Use fillers like "Bilkul...", "Main samajh sakta hoon...", "Theek hai...".
- Concisness: Keep your responses brief to allow the customer to speak.

CONVERSATION FLOW:
- Greet: "Namaste ${customerName} ji, Herbon Naturals se Aaditya bol raha hoon. Kaise hain aap?"
- Feedback: "Aapka pichla order humne deliver kiya tha. Result kaisa raha? Koi dikkat toh nahi aayi?"
- Handling Objections: If they say "price high hai", mention the quality and the discount you have for them.
- Reorder: "Agar aap satisfy hain, toh kya main aapke liye ek aur batch block kar doon? Aapke liye mere paas ek special discount coupon bhi hai."
- Closing: "Dhanyavaad ${customerName} ji. Have a great day!"`;

    // Add customer context
    if (profile) {
        script += `\n\nCUSTOMER CONTEXT:
- Total orders: ${profile.totalOrders}
- Preferred products: ${(profile.preferredProducts || []).join(', ') || 'N/A'}`;
    }

    // Add discount power
    if (discount.percent > 0) {
        script += `\n\nDISCOUNT TO OFFER: "${discount.percent}% off (Code: ${discount.code})"`;
    }

    return { script, profile, discount, productList };
}

// ==================== TRIGGER SINGLE CALL ====================
router.post('/agent/call', async (req, res) => {
    try {
        const { orderId, customerName, mobile, items, campaignId } = req.body;
        if (!mobile || !customerName) {
            return res.status(400).json({ success: false, message: 'mobile and customerName required' });
        }

        const callId = 'CALL-' + Date.now();
        const apiKey = process.env.BLAND_AI_API_KEY;
        const isLive = apiKey && apiKey !== 'your_api_key_here';

        let blandCallId = null;
        let callStatus = 'Triggered';

        // Load order for context
        let order = null;
        try {
            if (orderId) order = await Order.findOne({ orderId }).lean();
        } catch (e) { }

        // Build smart script
        const { script, profile, discount, productList } = await buildCallScript(customerName, items, order || { mobile });

        if (isLive) {
            // LIVE MODE — Call via Bland AI
            try {
                const host = req.get('host');
                const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.match(/^\d+\.\d+\.\d+\.\d+/);
                const webhookUrl = isLocal ? null : `${req.protocol}://${host}/api/agent/webhook`;

                console.log(`📡 Webhook URL: ${webhookUrl || 'Skipped (Local Environment)'}`);

                const elevenKey = process.env.ELEVEN_LABS_API_KEY;
                const elevenAgentId = process.env.ELEVEN_LABS_AGENT_ID;
                const elevenPhoneId = process.env.ELEVEN_LABS_PHONE_ID;

                // PRIORITIZE ELEVENLABS NATIVE (Outbound via SIP Trunk)
                if (elevenKey && elevenAgentId && elevenPhoneId) {
                    console.log(`🎙️ Triggering ELEVENLABS NATIVE call via SIP Trunk...`);
                    const elevenUrl = 'https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call';
                    const elevenData = {
                        agent_id: elevenAgentId,
                        phone_number_id: elevenPhoneId,
                        to_number: mobile.startsWith('+91') ? mobile : '+91' + mobile.replace(/\D/g, ''),
                        dynamic_variables: {
                            customer_name: customerName,
                            order_history: items || 'herbal products',
                            discount_code: discount.code || 'WELCOME5',
                            product_list: productList || 'Herbal tea, Shilajit, Ashwagandha'
                        }
                    };

                    const response = await axios.post(elevenUrl, elevenData, {
                        headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json' }
                    });

                    blandCallId = response.data?.call_id || response.data?.id || 'EL-' + Date.now();
                }
                // FALLBACK TO BLAND AI
                else {
                    const apiKey = process.env.BLAND_AI_API_KEY;
                    const voiceId = process.env.ELEVEN_LABS_VOICE_ID || 'maya';

                    if (!apiKey || apiKey === 'your_api_key_here') {
                        throw new Error('No Calling Service Configured (Setup ElevenLabs Agent ID + Phone ID or Bland AI API Key)');
                    }

                    console.log(`📞 Triggering BLAND AI call with voice: ${voiceId}`);
                    const callData = {
                        phone_number: mobile.startsWith('+91') ? mobile : '+91' + mobile.replace(/\D/g, ''),
                        task: script,
                        voice: voiceId,
                        reduce_latency: true,
                        language: 'hi',
                        max_duration: 300,
                        record: true,
                        background_track: 'office'
                    };

                    // Use ElevenLabs voice via Bland if key is provided
                    if (elevenKey && voiceId !== 'maya') {
                        callData.elevenlabs_api_key = elevenKey;
                    }

                    if (webhookUrl) callData.webhook = webhookUrl;

                    const response = await axios.post(BLAND_API_URL, callData, {
                        headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' }
                    });

                    blandCallId = response.data?.call_id || null;
                }

                callStatus = 'In Progress';
                console.log(`📞 LIVE call triggered to ${customerName} (${mobile}) — ID: ${blandCallId}`);
            } catch (apiErr) {
                console.error('❌ Calling Service Error:', apiErr.response?.data || apiErr.message);
                callStatus = 'Failed';
            }
        } else {
            // MOCK MODE
            console.log(`📞 [MOCK] Calling ${customerName} at ${mobile}...`);
            callStatus = 'Completed';
        }

        // Save call log
        const callLog = new CallLog({
            callId,
            campaignId: campaignId || null,
            orderId: orderId || '',
            customerName,
            mobile,
            items: items || '',
            callStatus,
            blandCallId,
            customerSegment: profile?.segment || 'Unknown',
            discountOffered: discount.code || '',
            discountPercent: discount.percent || 0,
            productsSuggested: productList ? productList.split(', ') : [],
            triggeredAt: new Date()
        });
        await callLog.save();

        // Update campaign
        if (campaignId) {
            await Campaign.updateOne(
                { campaignId, 'orders.orderId': orderId },
                {
                    $set: {
                        'orders.$.callStatus': callStatus,
                        'orders.$.callId': callId,
                        'orders.$.calledAt': new Date()
                    },
                    $inc: { 'stats.called': 1 }
                }
            );
        }

        // Mock mode: simulate result after 2 seconds
        if (!isLive) {
            setTimeout(async () => {
                const mockResults = ['Interested', 'Not Interested', 'Callback', 'Reordered'];
                const result = mockResults[Math.floor(Math.random() * mockResults.length)];
                const mockSentiment = result === 'Reordered' || result === 'Interested' ? 'positive' :
                    result === 'Callback' ? 'neutral' : 'negative';

                const updateData = {
                    callStatus: 'Completed',
                    callResult: result,
                    duration: Math.floor(Math.random() * 120) + 30,
                    sentiment: mockSentiment,
                    feedback: result === 'Interested' ? 'Customer wants to reorder next week' :
                        result === 'Reordered' ? 'Customer confirmed reorder' :
                            result === 'Callback' ? 'Customer asked to call back tomorrow' : 'Not interested currently',
                    transcript: `[MOCK TRANSCRIPT]\nAgent: Namaste ${customerName} ji, main Herbon Naturals se bol rahi hoon.\nCustomer: Haan ji boliye.\nAgent: Aapka order deliver ho gaya tha, products kaise lage?\nCustomer: ${result === 'Reordered' ? 'Bahut achhe lage, same order bhej do.' : result === 'Interested' ? 'Achhe lage, sochenge.' : result === 'Callback' ? 'Abhi busy hoon, kal call karna.' : 'Nahi chahiye abhi.'}\nAgent: ${result === 'Reordered' ? 'Bilkul ji, order confirm kar diya!' : 'Theek hai ji, dhanyavaad!'}`,
                    reorderIntent: result === 'Interested' || result === 'Reordered',
                    completedAt: new Date()
                };

                // Auto-create reorder in mock mode
                if (result === 'Reordered' && order) {
                    try {
                        const reorderResult = await createCallReorder(order, customerName, mobile, discount);
                        updateData.reorderCreated = true;
                        updateData.newOrderId = reorderResult.newOrderId;
                        console.log(`🎉 [MOCK] Auto-reorder from call: ${reorderResult.newOrderId}`);
                    } catch (e) {
                        console.log('⚠️ Mock reorder failed:', e.message);
                    }
                }

                await CallLog.updateOne({ callId }, updateData);

                // Update campaign stats
                if (campaignId) {
                    const field = result === 'Interested' ? 'stats.interested' :
                        result === 'Reordered' ? 'stats.reordered' :
                            result === 'Not Interested' ? 'stats.notInterested' : null;
                    if (field) {
                        await Campaign.updateOne(
                            { campaignId, 'orders.orderId': orderId },
                            {
                                $set: { 'orders.$.callStatus': 'Completed', 'orders.$.callResult': result },
                                $inc: { [field]: 1 }
                            }
                        );
                    }
                }
            }, 2000);
        }

        res.json({
            success: true,
            callId,
            callStatus,
            mode: isLive ? 'live' : 'mock',
            customerSegment: profile?.segment || 'Unknown',
            discountCode: discount.code
        });
    } catch (err) {
        console.error('❌ Error triggering call:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== AUTO-CREATE REORDER FROM CALL ====================
async function createCallReorder(order, customerName, mobile, discount) {
    const newOrderId = 'CALL-RO-' + Date.now();
    const now = new Date().toISOString();

    let total = order.total || 0;
    if (discount && discount.percent > 0) {
        total = Math.round(total - (total * discount.percent / 100));
    }

    const newOrder = new Order({
        orderId: newOrderId,
        timestamp: now,
        employee: 'AI Voice Agent',
        employeeId: 'VOICEBOT',
        customerName: order.customerName || customerName,
        telNo: order.telNo || '',
        mobile: order.mobile || mobile,
        altNo: order.altNo || '',
        address: order.address || 'Address pending',
        hNo: order.hNo || '',
        villColony: order.villColony || '',
        landmark: order.landmark || order.landMark || '',
        city: order.city || '',
        state: order.state || 'N/A',
        pin: order.pin || '',
        pincode: order.pincode || order.pin || '',
        distt: order.distt || '',
        orderType: 'AI Call Reorder',
        date: now.split('T')[0],
        time: now.split('T')[1]?.substring(0, 5),
        treatment: order.treatment || '',
        paymentMode: order.paymentMode || 'COD',
        total,
        codAmount: total,
        items: order.items || [],
        status: 'Pending',
        remarks: [{
            text: `Auto-reorder via AI Voice Call from order ${order.orderId}${discount?.percent ? ` (${discount.percent}% discount, code: ${discount.code})` : ''}`,
            addedBy: 'AI Voice Agent',
            addedAt: now,
            timestamp: now
        }]
    });
    await newOrder.save();

    await Reorder.create({
        reorderId: 'RO-CALL-' + Date.now(),
        originalOrderId: order.orderId,
        newOrderId,
        customerName: order.customerName || customerName,
        mobile: order.mobile || mobile,
        address: order.address || 'Address pending',
        state: order.state || 'N/A',
        items: order.items || [],
        total,
        paymentMode: order.paymentMode || 'COD',
        source: 'AI Call',
        status: 'Created'
    });

    return { success: true, newOrderId, total };
}

// ==================== BLAND AI WEBHOOK ====================
router.post('/agent/webhook', async (req, res) => {
    try {
        const data = req.body;
        const blandCallId = data.call_id;

        if (!blandCallId) return res.status(400).json({ error: 'No call_id' });

        const transcript = (data.concatenated_transcript || '').toLowerCase();

        // Enhanced result detection with more Hindi/Hinglish keywords
        let result = 'Not Interested';
        if (transcript.match(/haan|yes|order|bhej do|bhejo|chahiye|karwa do|kar do|same bhej/)) {
            result = 'Reordered';
        } else if (transcript.match(/baad mein|later|kal|kisi aur din|abhi nahi|busy/)) {
            result = 'Callback';
        } else if (transcript.match(/interested|sochenge|batata|bataenge|dekhte|consider/)) {
            result = 'Interested';
        }

        // Sentiment detection
        let sentiment = 'neutral';
        if (transcript.match(/achha|bahut achh|khush|happy|great|maza|perfect|excellent|dhanyavaad/)) {
            sentiment = 'positive';
        } else if (transcript.match(/kharab|problem|complaint|naraaz|angry|galat|waste|bekaar/)) {
            sentiment = 'negative';
        }

        const updateData = {
            callStatus: 'Completed',
            callResult: result,
            duration: data.call_length || 0,
            transcript: data.concatenated_transcript || '',
            feedback: result,
            sentiment,
            reorderIntent: result === 'Interested' || result === 'Reordered',
            completedAt: new Date()
        };

        // Auto-create reorder if customer confirmed
        if (result === 'Reordered') {
            const log = await CallLog.findOne({ blandCallId }).lean();
            if (log && !log.reorderCreated) {
                try {
                    const order = await Order.findOne({ orderId: log.orderId }).lean();
                    if (order) {
                        const discount = { percent: log.discountPercent || 0, code: log.discountOffered || '' };
                        const reorderResult = await createCallReorder(order, log.customerName, log.mobile, discount);
                        updateData.reorderCreated = true;
                        updateData.newOrderId = reorderResult.newOrderId;
                        console.log(`🎉 Auto-reorder from call: ${reorderResult.newOrderId}`);
                    }
                } catch (e) {
                    console.error('❌ Call reorder failed:', e.message);
                }
            }
        }

        await CallLog.updateOne({ blandCallId }, updateData);

        // Update campaign
        const log = await CallLog.findOne({ blandCallId }).lean();
        if (log?.campaignId) {
            const field = result === 'Interested' ? 'stats.interested' :
                result === 'Reordered' ? 'stats.reordered' :
                    'stats.notInterested';
            await Campaign.updateOne(
                { campaignId: log.campaignId, 'orders.orderId': log.orderId },
                {
                    $set: { 'orders.$.callStatus': 'Completed', 'orders.$.callResult': result },
                    $inc: { [field]: 1 }
                }
            );
        }

        // Update customer profile sentiment
        if (log) {
            try {
                const cleanPhone = (log.mobile || '').replace(/\D/g, '').slice(-10);
                await CustomerProfile.updateOne(
                    { phone: { $regex: cleanPhone } },
                    { $set: { lastSentiment: sentiment } }
                );
            } catch (e) { }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('❌ Webhook error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== SCHEDULE A CALL ====================
router.post('/agent/schedule', async (req, res) => {
    try {
        const { orderId, customerName, mobile, items, scheduledAt, campaignId } = req.body;
        if (!mobile || !customerName || !scheduledAt) {
            return res.status(400).json({ success: false, message: 'mobile, customerName, and scheduledAt required' });
        }

        const callId = 'SCHED-' + Date.now();

        await CallLog.create({
            callId,
            orderId: orderId || '',
            customerName,
            mobile,
            items: items || '',
            callStatus: 'Scheduled',
            campaignId: campaignId || null,
            scheduledAt: new Date(scheduledAt),
            scheduledBy: 'Dashboard',
            triggeredAt: new Date()
        });

        console.log(`⏰ Call scheduled: ${customerName} at ${new Date(scheduledAt).toLocaleString()}`);
        res.json({ success: true, callId, message: `Call scheduled for ${customerName}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET SCHEDULED CALLS ====================
router.get('/agent/scheduled', async (req, res) => {
    try {
        const scheduled = await CallLog.find({ callStatus: 'Scheduled' })
            .sort({ scheduledAt: 1 })
            .limit(50)
            .lean();
        res.json({ success: true, scheduled, count: scheduled.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== RUN SCHEDULED CALLS ====================
router.post('/agent/run-scheduled', async (req, res) => {
    try {
        const now = new Date();
        const dueCalls = await CallLog.find({
            callStatus: 'Scheduled',
            scheduledAt: { $lte: now }
        }).limit(10);

        let triggered = 0;
        const results = [];

        for (const call of dueCalls) {
            // Re-trigger as a normal call
            call.callStatus = 'Triggered';
            call.triggeredAt = now;
            await call.save();

            // Build script and make the call
            let order = null;
            try { order = await Order.findOne({ orderId: call.orderId }).lean(); } catch (e) { }

            const { script, profile, discount } = await buildCallScript(call.customerName, call.items, order || { mobile: call.mobile });

            const apiKey = process.env.BLAND_AI_API_KEY;
            const isLive = apiKey && apiKey !== 'your_api_key_here';

            if (isLive) {
                try {
                    const response = await axios.post(BLAND_API_URL, {
                        phone_number: call.mobile.startsWith('+91') ? call.mobile : '+91' + call.mobile.replace(/\D/g, ''),
                        task: script,
                        voice: 'maya',
                        reduce_latency: true,
                        language: 'hi',
                        max_duration: 300,
                        record: true
                    }, {
                        headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' }
                    });

                    call.blandCallId = response.data?.call_id;
                    call.callStatus = 'In Progress';
                    await call.save();
                } catch (e) {
                    call.callStatus = 'Failed';
                    await call.save();
                }
            } else {
                // Mock mode
                call.callStatus = 'Completed';
                call.callResult = 'Interested';
                call.duration = 60;
                call.sentiment = 'positive';
                call.transcript = `[SCHEDULED MOCK] Call to ${call.customerName} completed successfully.`;
                call.completedAt = now;
                await call.save();
            }

            triggered++;
            results.push({ callId: call.callId, customerName: call.customerName, status: call.callStatus });
        }

        res.json({ success: true, message: `${triggered} scheduled calls triggered`, triggered, results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== CALL ANALYTICS ====================
router.get('/agent/analytics', async (req, res) => {
    try {
        const [
            totalCalls,
            completedCalls,
            scheduledCalls,
            resultBreakdown,
            sentimentBreakdown,
            avgDuration,
            reordersFromCalls
        ] = await Promise.all([
            CallLog.countDocuments(),
            CallLog.countDocuments({ callStatus: 'Completed' }),
            CallLog.countDocuments({ callStatus: 'Scheduled' }),
            CallLog.aggregate([
                { $match: { callResult: { $ne: '' } } },
                { $group: { _id: '$callResult', count: { $sum: 1 } } }
            ]),
            CallLog.aggregate([
                { $match: { sentiment: { $ne: '' } } },
                { $group: { _id: '$sentiment', count: { $sum: 1 } } }
            ]),
            CallLog.aggregate([
                { $match: { duration: { $gt: 0 } } },
                { $group: { _id: null, avg: { $avg: '$duration' }, total: { $sum: '$duration' } } }
            ]),
            CallLog.countDocuments({ reorderCreated: true })
        ]);

        const reorderRate = completedCalls > 0 ?
            Math.round((reordersFromCalls / completedCalls) * 100) : 0;

        res.json({
            success: true,
            callAnalytics: {
                totalCalls,
                completedCalls,
                scheduledCalls,
                reordersFromCalls,
                reorderRate,
                avgDuration: Math.round(avgDuration[0]?.avg || 0),
                totalCallTime: Math.round((avgDuration[0]?.total || 0) / 60), // in minutes
                resultBreakdown: resultBreakdown.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {}),
                sentimentBreakdown: sentimentBreakdown.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {})
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET CALL LOGS ====================
router.get('/agent/logs', async (req, res) => {
    try {
        const logs = await CallLog.find().sort({ triggeredAt: -1 }).limit(200).lean();
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET SINGLE CALL LOG (with transcript) ====================
router.get('/agent/logs/:callId', async (req, res) => {
    try {
        const log = await CallLog.findOne({ callId: req.params.callId }).lean();
        if (!log) return res.status(404).json({ success: false, message: 'Call log not found' });
        res.json({ success: true, log });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
