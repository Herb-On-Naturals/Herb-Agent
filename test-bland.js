const axios = require('axios');
require('dotenv').config();

const BLAND_API_URL = 'https://api.bland.ai/v1/calls';
const apiKey = process.env.BLAND_AI_API_KEY;
const testPhone = process.env.TEST_PHONE_NUMBER;

async function testCall() {
    if (!apiKey || apiKey === 'your_bland_ai_api_key_here') {
        console.error('Missing BLAND_AI_API_KEY in .env');
        process.exit(1);
    }

    if (!testPhone) {
        console.error('Missing TEST_PHONE_NUMBER in .env');
        process.exit(1);
    }

    const callData = {
        phone_number: testPhone.startsWith('+') ? testPhone : `+91${testPhone.replace(/\D/g, '')}`,
        task: 'Test call for minimal functionality.',
        voice: 'maya',
        reduce_latency: true
    };

    try {
        const response = await axios.post(BLAND_API_URL, callData, {
            headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' }
        });
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.log('❌ Error Status:', error.response?.status);
        console.log('❌ Error Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

testCall();
