const axios = require('axios');
require('dotenv').config();

async function testAISimulation() {
    console.log('Testing AI Simulation...');
    const API_URL = 'https://herb-agent.onrender.com/api/bot/simulate';
    const TEST_PHONE = '919911799660'; 
    const TEST_MESSAGE = 'Hello Herbon AI, mujhe order karna hai';

    try {
        console.log(`Sending message to ${API_URL}...`);
        // We'll simulate a POST to /api/bot/simulate which doesn't require Meta Webhook
        // But it DOES require auth normally. 
        // Wait, let's use the local logic instead to test the AI functionality.
    } catch (e) {
        console.error('Error:', e.message);
    }
}

// Better yet, let's test the Groq API again and the sendWhatsApp function logic
async function testBotLogic() {
    const { getAIResponse } = require('./routes/wa-bot'); // This might fail due to lack of environment/db in script
    // I'll just check if I can trigger the /api/bot/simulate on Render if I was logged in
}

testAISimulation();
