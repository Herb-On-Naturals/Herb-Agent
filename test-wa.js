const axios = require('axios');
require('dotenv').config();

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const GRAPH_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

async function testWA() {
    console.log('Testing WhatsApp with ID:', PHONE_NUMBER_ID);
    try {
        const res = await axios.post(GRAPH_URL, {
            messaging_product: 'whatsapp',
            to: '919582589655',
            type: 'text',
            text: { body: 'Namaste Chandan ji! Ye ek test message hai Herbon AI se.' }
        }, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' }
        });

        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('❌ FAILED!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Error Details:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Message:', err.message);
        }
    }
}

testWA();
