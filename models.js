const mongoose = require('mongoose');

// ==================== REUSE EXISTING ORDER SCHEMA ====================
// This reads from the SAME 'orders' collection as Herb-Server
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, required: true },
    employee: String,
    employeeId: String,
    customerName: { type: String, required: true },
    telNo: String,
    mobile: String,
    altNo: String,
    email: String,
    address: { type: String, required: true },
    hNo: String,
    blockGaliNo: String,
    villColony: String,
    landmark: String,
    landMark: String,
    postOfficeName: String,
    po: String,
    tahTaluka: String,
    distt: String,
    city: String,
    state: { type: String, required: true },
    pin: String,
    pincode: String,
    orderType: String,
    date: String,
    time: String,
    treatment: String,
    paymentMode: { type: String, default: 'COD' },
    total: { type: Number, required: true },
    advance: Number,
    codAmount: Number,
    items: [{
        description: String,
        quantity: Number,
        price: Number,
        rate: Number,
        amount: Number
    }],
    status: {
        type: String,
        enum: ['Pending', 'Address Verified', 'Dispatched', 'Out For Delivery', 'Delivered', 'Cancelled', 'RTO', 'On Hold', 'Unverified', 'Delivery Requested'],
        default: 'Pending',
        index: true
    },
    verifiedBy: String,
    verifiedAt: String,
    verificationRemark: { text: String, addedBy: String, addedAt: String },
    dispatchedBy: String,
    dispatchedAt: String,
    ofdAt: String,
    deliveredBy: String,
    deliveredAt: String,
    rtoAt: String,
    deliveryRequested: Boolean,
    deliveryRequestedBy: { employeeId: String, employeeName: String, requestedAt: String },
    shiprocket: { awb: String, courierName: String, shiprocketOrderId: String, dispatchedAt: String },
    tracking: {
        courier: String, trackingId: String, currentStatus: String,
        lastUpdate: String, lastUpdatedAt: String, location: String,
        dispatchedAt: String, allScans: [mongoose.Schema.Types.Mixed]
    },
    holdDetails: { isOnHold: { type: Boolean, default: false }, holdReason: String, expectedDispatchDate: Date, holdBy: String, holdAt: String },
    remarks: [{ text: String, addedBy: String, addedAt: String, timestamp: String }],
    cancellationInfo: { cancelledAt: Date, cancelledBy: String, cancellationReason: String },
    suggestedCourier: String,
    courierSuggestion: { suggestedCourier: String, suggestedBy: String, suggestedAt: Date, suggestionNote: String },
    updatedAt: String
}, { timestamps: true, collection: 'orders' });

// ==================== CAMPAIGN SCHEMA ====================
const campaignSchema = new mongoose.Schema({
    campaignId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['Draft', 'Active', 'Paused', 'Completed'], default: 'Draft' },
    orders: [{
        orderId: String,
        customerName: String,
        mobile: String,
        items: String,
        total: Number,
        callStatus: { type: String, enum: ['Pending', 'Calling', 'Completed', 'Failed', 'No Answer'], default: 'Pending' },
        callResult: { type: String, enum: ['', 'Interested', 'Not Interested', 'Callback', 'Wrong Number', 'Reordered'], default: '' },
        callId: String,
        callDuration: Number,
        callNotes: String,
        calledAt: Date
    }],
    stats: {
        totalOrders: { type: Number, default: 0 },
        called: { type: Number, default: 0 },
        interested: { type: Number, default: 0 },
        reordered: { type: Number, default: 0 },
        notInterested: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date
}, { timestamps: true, collection: 'agent_campaigns' });

// ==================== CALL LOG SCHEMA ====================
const callLogSchema = new mongoose.Schema({
    callId: { type: String, required: true, unique: true },
    campaignId: String,
    orderId: { type: String, default: '' },
    customerName: String,
    mobile: String,
    items: String,
    callStatus: { type: String, enum: ['Triggered', 'In Progress', 'Completed', 'Failed', 'No Answer', 'Scheduled'], default: 'Triggered' },
    callResult: { type: String, enum: ['', 'Interested', 'Not Interested', 'Callback', 'Wrong Number', 'Reordered'], default: '' },
    duration: Number,
    transcript: String,
    feedback: String,
    reorderIntent: { type: Boolean, default: false },
    blandCallId: String,
    // WhatsApp message fields (used by whatsapp.js)
    type: { type: String, enum: ['call', 'whatsapp', ''], default: '' },
    status: String,
    result: String,
    notes: String,
    // Enhanced fields
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative', ''], default: '' },
    customerSegment: String,
    discountOffered: String,
    discountPercent: { type: Number, default: 0 },
    productsSuggested: [String],
    scheduledAt: Date,              // When to make the call
    scheduledBy: String,            // Who scheduled it
    reorderCreated: { type: Boolean, default: false },
    newOrderId: String,
    triggeredAt: { type: Date, default: Date.now },
    completedAt: Date
}, { timestamps: true, collection: 'agent_call_logs' });

// ==================== REORDER SCHEMA ====================
const reorderSchema = new mongoose.Schema({
    reorderId: { type: String, required: true, unique: true },
    originalOrderId: { type: String, required: true },
    newOrderId: String,
    customerName: String,
    mobile: String,
    address: String,
    state: String,
    items: [{
        description: String,
        quantity: Number,
        price: Number,
        amount: Number
    }],
    total: Number,
    paymentMode: { type: String, default: 'COD' },
    source: { type: String, enum: ['Manual', 'AI Call', 'Campaign', 'WhatsApp AI', 'WhatsApp'], default: 'Manual' },
    campaignId: String,
    status: { type: String, enum: ['Created', 'Synced', 'Failed'], default: 'Created' },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'agent_reorders' });

// ==================== PRODUCT CATALOG SCHEMA ====================
const productSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nameHindi: String,              // Hindi/Hinglish name for AI
    category: { type: String, default: 'General' },
    price: { type: Number, required: true },
    mrp: Number,
    description: String,
    benefits: [String],             // ["Chemical-free", "Herbal", "Natural"]
    ingredients: String,
    imageUrl: String,
    isActive: { type: Boolean, default: true },
    bestSeller: { type: Boolean, default: false },
    tags: [String]                  // ["hair", "skin", "wellness"]
}, { timestamps: true, collection: 'agent_products' });

// ==================== CUSTOMER PROFILE SCHEMA ====================
const customerProfileSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true, index: true },
    customerName: String,
    email: String,
    address: String,
    city: String,
    state: String,
    // Order History Stats
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 },
    lastOrderDate: Date,
    firstOrderDate: Date,
    preferredProducts: [String],     // Most ordered product names
    preferredPayment: { type: String, default: 'COD' },
    // Engagement
    totalConversations: { type: Number, default: 0 },
    totalReorders: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },  // reorders/conversations
    // Sentiment
    avgSentiment: { type: Number, default: 0 },     // -1 to 1 scale
    lastSentiment: String,                          // positive/neutral/negative
    // Customer Segment
    segment: {
        type: String,
        enum: ['VIP', 'Regular', 'New', 'Inactive', 'Lost'],
        default: 'New'
    },
    // Discounts
    discountsGiven: { type: Number, default: 0 },
    totalDiscountAmount: { type: Number, default: 0 },
    lastDiscountDate: Date,
    // Tags
    tags: [String],
    notes: String,
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'agent_customer_profiles' });

// ==================== CONVERSATION SCHEMA (WhatsApp AI Bot) ====================
const conversationSchema = new mongoose.Schema({
    phone: { type: String, required: true, index: true },
    customerName: String,
    originalOrderId: String,
    originalOrderMongoId: String,
    messages: [{
        role: { type: String, enum: ['system', 'assistant', 'user'] },
        content: String,
        sentiment: String,            // positive/neutral/negative per message
        timestamp: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['active', 'interested', 'reordered', 'not_interested', 'closed'],
        default: 'active'
    },
    reorderCreated: { type: Boolean, default: false },
    newOrderId: String,
    // Advanced fields
    overallSentiment: { type: String, default: 'neutral' },
    sentimentScore: { type: Number, default: 0 },
    followUpAt: Date,
    followUpCount: { type: Number, default: 0 },
    discountOffered: String,
    discountPercent: { type: Number, default: 0 },
    customerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerProfile' },
    modifiedCart: [{                  // For multi-step order flow
        productId: String,
        name: String,
        quantity: Number,
        price: Number
    }],
    lastMessageAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'agent_conversations' });

const Order = mongoose.model('Order', orderSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const CallLog = mongoose.model('CallLog', callLogSchema);
const Reorder = mongoose.model('Reorder', reorderSchema);
const Product = mongoose.model('Product', productSchema);
const CustomerProfile = mongoose.model('CustomerProfile', customerProfileSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = { Order, Campaign, CallLog, Reorder, Product, CustomerProfile, Conversation };
