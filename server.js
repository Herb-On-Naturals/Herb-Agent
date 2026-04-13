const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = (process.env.MONGODB_URI || '').trim();
const MongoStore = connectMongo.default || connectMongo.MongoStore || connectMongo;

// Required on Render/behind reverse proxy so secure session cookies work correctly.
app.set('trust proxy', 1);

// Global Traffic Tracer
app.use((req, res, next) => {
    if (req.path.includes('webhook') || req.path.includes('bot')) {
        console.log(`🌐 [GLOBAL TRAFFIC] ${req.method} ${req.path} from ${req.ip}`);
    }
    next();
});

// ==================== SECURITY MIDDLEWARE ====================
// Helmet — security headers (XSS, clickjacking, MIME sniffing protection)
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for SPA compatibility
    crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(express.json({
    limit: '5mb',
    verify: (req, res, buf) => {
        if (req.originalUrl && req.originalUrl.includes('/webhook')) {
            req.rawBody = buf.toString('utf8');
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// CORS — restricted to allowed origins
function normalizeOrigin(value) {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    try {
        const u = new URL(trimmed);
        return `${u.protocol}//${u.host}`.toLowerCase();
    } catch (e) {
        return trimmed.replace(/\/+$/, '').toLowerCase();
    }
}

const rawAllowedOrigins = (process.env.ALLOWED_ORIGINS || '').trim();
const allowAllOrigins = rawAllowedOrigins === '*';
const configuredOrigins = rawAllowedOrigins
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
const renderExternalOrigin = normalizeOrigin(process.env.RENDER_EXTERNAL_URL || '');
const allowedOrigins = Array.from(new Set([...configuredOrigins, renderExternalOrigin]));
const hasCorsAllowlist = allowAllOrigins || allowedOrigins.length > 0;

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // If allowlist is not configured in production, avoid hard-failing requests.
        if (!hasCorsAllowlist) {
            return callback(null, true);
        }

        if (allowAllOrigins) {
            return callback(null, true);
        }

        const normalizedOrigin = normalizeOrigin(origin);
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// Session Setup — with MongoDB store (no memory leak)
let sessionStoreLabel = 'MemoryStore';
const sessionConfig = {
    secret: process.env.SECRET_KEY || process.env.JWT_SECRET || 'change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    }
};

if (MONGODB_URI) {
    try {
        if (typeof MongoStore.create !== 'function') {
            throw new Error('connect-mongo create() not available');
        }
        sessionConfig.store = MongoStore.create({
            mongoUrl: MONGODB_URI,
            collectionName: 'agent_sessions',
            ttl: 24 * 60 * 60 // 24 hours
        });
        sessionStoreLabel = 'MongoStore';
    } catch (err) {
        console.error('Failed to initialize MongoStore:', err.message);
        console.warn('Falling back to MemoryStore. Set valid MONGODB_URI for production.');
    }
} else {
    console.warn('MONGODB_URI not set. Using MemoryStore for sessions.');
}

app.use(session(sessionConfig));

// Rate Limiters
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many login attempts, try after 15 minutes' } });
const webhookLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 200 }); // Webhooks need higher limits

app.use('/api/', apiLimiter);

// Auth Middleware
const requireAuth = (req, res, next) => {
    // Skip auth for login, webhooks, and public routes
    const publicPaths = [
        '/api/auth/login',
        '/api/auth/status',
        '/api/health',
        '/api/agent/webhook',
        '/api/whatsapp/webhook',
        '/api/bot/webhook',
        '/api/bot/start',
        '/api/bot/simulate',
        '/api/upload-excel'
    ];
    if (publicPaths.includes(req.path) || !req.path.startsWith('/api')) {
        return next();
    }

    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
};

app.use(requireAuth);

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// ==================== AUTH ROUTES ====================
app.get('/api/auth/status', (req, res) => {
    res.json({ authenticated: !!(req.session && req.session.isAuthenticated) });
});

function normalizeSecret(value) {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/^['"]|['"]$/g, '');
}

app.post('/api/auth/login', authLimiter, (req, res) => {
    const { password } = req.body;
    const adminPass = normalizeSecret(process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET);
    const enteredPass = normalizeSecret(password);

    if (!enteredPass) {
        return res.status(400).json({ success: false, message: 'Password required' });
    }

    if (!adminPass) {
        return res.status(500).json({
            success: false,
            message: 'ADMIN_PASSWORD (or ADMIN_SECRET) is not configured on server. Set env var and redeploy.'
        });
    }

    if (enteredPass === adminPass) {
        req.session.isAuthenticated = true;
        res.json({ success: true, message: 'Logged in successfully' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out' });
    });
});

// ==================== DATABASE ====================
async function connectDB() {
    try {
        const uri = MONGODB_URI;
        if (!uri) {
            console.error('❌ MONGODB_URI not set!');
            return false;
        }
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connected — Database:', mongoose.connection.name);
        return true;
    } catch (err) {
        console.error('❌ MongoDB Connection Failed:', err.message);
        return false;
    }
}

// ==================== ROUTES ====================
const orderRoutes = require('./routes/orders');
const campaignRoutes = require('./routes/campaigns');
const agentRoutes = require('./routes/agent');
const uploadRoutes = require('./routes/upload');
const whatsappRoutes = require('./routes/whatsapp');
const waBotRoutes = require('./routes/wa-bot');
const productRoutes = require('./routes/products');
const analyticsRoutes = require('./routes/analytics');
const followupRoutes = require('./routes/followup');

app.use('/api', orderRoutes);
app.use('/api', campaignRoutes);
app.use('/api', agentRoutes);
app.use('/api', uploadRoutes);
app.use('/api', whatsappRoutes);
app.use('/api', waBotRoutes);
app.use('/api', productRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', followupRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Herb Agent',
        db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// SPA Catch-all
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ==================== GLOBAL ERROR HANDLERS ====================
// Express error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled Express Error:', err.message);
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ success: false, message: 'CORS: Origin not allowed' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Uncaught exceptions — log and keep running
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    mongoose.connection.close(false).then(() => {
        console.log('✅ MongoDB connection closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Shutting down...');
    mongoose.connection.close(false).then(() => {
        process.exit(0);
    });
});

// ==================== CRON JOBS ====================
// Auto-run follow-ups every 30 minutes
cron.schedule('*/30 * * * *', async () => {
    try {
        const { Conversation } = require('./models');
        const axios = require('axios');
        const now = new Date();

        const conversations = await Conversation.find({
            status: { $in: ['active', 'interested'] },
            followUpAt: { $lte: now },
            followUpCount: { $lt: 3 }
        }).limit(10);

        if (conversations.length === 0) return;

        const FOLLOWUP_MESSAGES = {
            0: '🙏 Namaste ji! Humne aapko pehle message kiya tha. Kya aapne dekha? Agar koi sawaal hai toh batayein!',
            1: '🎁 Ji, aapke liye ek special offer hai — agar aaj order karein toh extra discount milega!',
            2: '👋 Ji, jab bhi aapko Herbon products chahiye, bas hume message kar dijiye. Dhanyavaad! 🙏'
        };

        for (const conv of conversations) {
            const message = FOLLOWUP_MESSAGES[conv.followUpCount] || FOLLOWUP_MESSAGES[2];

            conv.messages.push({
                role: 'assistant',
                content: `[AUTO FOLLOW-UP #${conv.followUpCount + 1}] ${message}`,
                timestamp: now
            });

            conv.followUpCount += 1;
            conv.lastMessageAt = now;

            if (conv.followUpCount >= 3) {
                conv.status = 'closed';
                conv.followUpAt = null;
            } else {
                const nextDelay = conv.followUpCount === 1 ? 48 * 60 * 60 * 1000 : 72 * 60 * 60 * 1000;
                conv.followUpAt = new Date(now.getTime() + nextDelay);
            }

            await conv.save();

            // Try sending via WhatsApp
            try {
                const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WA_PHONE_NUMBER_ID;
                const token = process.env.META_WA_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
                const apiVersion = process.env.META_WA_API_VERSION || ((process.env.META_WA_API_VERSIONS || 'v18.0').split(',')[0] || 'v18.0').trim();
                if (phoneId && token) {
                    await axios.post(
                        `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`,
                        { messaging_product: 'whatsapp', to: conv.phone, type: 'text', text: { body: message } },
                        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
                    );
                }
            } catch (e) {
                console.log(`⚠️ [CRON] Follow-up WA failed for ${conv.customerName}: ${e.message}`);
            }
        }
        console.log(`⏰ [CRON] Processed ${conversations.length} follow-ups`);
    } catch (err) {
        console.error('❌ [CRON] Follow-up error:', err.message);
    }
});

// Auto-run scheduled calls every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    try {
        const { CallLog } = require('./models');
        const now = new Date();

        const dueCalls = await CallLog.find({
            callStatus: 'Scheduled',
            scheduledAt: { $lte: now }
        }).limit(5);

        if (dueCalls.length === 0) return;
        console.log(`⏰ [CRON] Found ${dueCalls.length} scheduled calls to trigger`);

        // Mark them as ready — the actual calling is handled by agent.js logic
        for (const call of dueCalls) {
            call.callStatus = 'Triggered';
            call.triggeredAt = now;
            await call.save();
        }
    } catch (err) {
        console.error('❌ [CRON] Scheduled calls error:', err.message);
    }
});

// ==================== START ====================
async function start() {
    const dbOk = await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║    🤖 HERB AGENT STARTED 🤖                  ║');
        console.log(`║    Port: ${PORT}                                  ║`);
        console.log(`║    DB:   ${dbOk ? '🟢 Connected' : '🔴 Disconnected'}                  ║`);
        console.log(`║    Mode: ${process.env.BLAND_AI_API_KEY ? '🟢 Live' : '🟡 Mock (No API Key)'}              ║`);
        console.log(`║    Env:  ${process.env.NODE_ENV || 'development'}                    ║`);
        console.log('║    🔒 Helmet: ON | 📦 MongoStore: ON          ║');
        console.log('║    ⏰ Cron: Follow-ups + Scheduled Calls      ║');
        console.log('╚══════════════════════════════════════════════╝');
    });
}

start().catch(err => {
    console.error('❌ Failed to start:', err);
    process.exit(1);
});
