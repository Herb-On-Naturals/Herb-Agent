const express = require('express');
const router = express.Router();
const { Product } = require('../models');

// ==================== HERBON NATURALS PRODUCT CATALOG ====================
const SEED_PRODUCTS = [
    {
        productId: 'HRB-001', name: 'Herbon Hair Oil', nameHindi: 'Herbon Hair Oil',
        category: 'Hair Care', price: 499, mrp: 699,
        description: 'Premium herbal hair oil for strong, healthy hair',
        benefits: ['Reduces hair fall', 'Promotes growth', '100% Natural', 'Chemical-free'],
        ingredients: 'Bhringraj, Amla, Brahmi, Coconut Oil, Sesame Oil',
        bestSeller: true, tags: ['hair', 'oil', 'bestseller']
    },
    {
        productId: 'HRB-002', name: 'Herbon Shampoo', nameHindi: 'Herbon Shampoo',
        category: 'Hair Care', price: 349, mrp: 499,
        description: 'Gentle herbal shampoo for daily use',
        benefits: ['SLS-free', 'Paraben-free', 'Natural cleansing', 'Soft & shiny hair'],
        ingredients: 'Reetha, Shikakai, Amla, Aloe Vera',
        bestSeller: true, tags: ['hair', 'shampoo', 'bestseller']
    },
    {
        productId: 'HRB-003', name: 'Herbon Face Cream', nameHindi: 'Herbon Face Cream',
        category: 'Skin Care', price: 399, mrp: 599,
        description: 'Natural face cream for glowing skin',
        benefits: ['Anti-aging', 'Moisturizing', 'Brightening', 'Herbal formula'],
        ingredients: 'Turmeric, Saffron, Aloe Vera, Shea Butter',
        bestSeller: false, tags: ['skin', 'cream', 'face']
    },
    {
        productId: 'HRB-004', name: 'Herbon Body Lotion', nameHindi: 'Herbon Body Lotion',
        category: 'Skin Care', price: 299, mrp: 449,
        description: 'Deep moisturizing herbal body lotion',
        benefits: ['24hr moisture', 'Non-greasy', 'Natural fragrance', 'All skin types'],
        ingredients: 'Coconut Milk, Almond Oil, Vitamin E, Aloe Vera',
        bestSeller: false, tags: ['skin', 'lotion', 'body']
    },
    {
        productId: 'HRB-005', name: 'Herbon Hair Conditioner', nameHindi: 'Herbon Hair Conditioner',
        category: 'Hair Care', price: 379, mrp: 549,
        description: 'Deep conditioning treatment for silky hair',
        benefits: ['Deep nourishment', 'Detangling', 'Frizz control', 'Natural shine'],
        ingredients: 'Argan Oil, Keratin, Hibiscus, Coconut Milk',
        bestSeller: false, tags: ['hair', 'conditioner']
    },
    {
        productId: 'HRB-006', name: 'Herbon Aloe Vera Gel', nameHindi: 'Herbon Aloe Vera Gel',
        category: 'Skin Care', price: 249, mrp: 399,
        description: 'Pure aloe vera gel for skin and hair',
        benefits: ['Soothing', 'Cooling', 'Multi-purpose', '99% Pure Aloe'],
        ingredients: '99% Aloe Vera, Vitamin E, Tea Tree Oil',
        bestSeller: true, tags: ['skin', 'hair', 'aloe', 'bestseller']
    },
    {
        productId: 'HRB-007', name: 'Herbon Anti-Dandruff Oil', nameHindi: 'Herbon Anti-Dandruff Oil',
        category: 'Hair Care', price: 449, mrp: 649,
        description: 'Specialized oil to fight dandruff naturally',
        benefits: ['Anti-dandruff', 'Anti-fungal', 'Scalp health', 'Itch relief'],
        ingredients: 'Neem, Tea Tree, Rosemary, Lemon Grass',
        bestSeller: false, tags: ['hair', 'dandruff', 'oil']
    },
    {
        productId: 'HRB-008', name: 'Herbon Face Wash', nameHindi: 'Herbon Face Wash',
        category: 'Skin Care', price: 279, mrp: 399,
        description: 'Gentle daily face wash for clear skin',
        benefits: ['Deep cleansing', 'Acne control', 'Oil-free', 'Gentle formula'],
        ingredients: 'Neem, Tulsi, Tea Tree, Charcoal',
        bestSeller: false, tags: ['skin', 'face', 'wash']
    },
    {
        productId: 'HRB-009', name: 'Herbon Complete Hair Kit', nameHindi: 'Herbon Complete Hair Kit',
        category: 'Combo', price: 999, mrp: 1499,
        description: 'Complete hair care combo - Oil + Shampoo + Conditioner',
        benefits: ['Complete solution', 'Save 33%', 'Gift pack', 'Best value'],
        ingredients: 'Hair Oil + Shampoo + Conditioner combo',
        bestSeller: true, tags: ['combo', 'hair', 'kit', 'bestseller']
    },
    {
        productId: 'HRB-010', name: 'Herbon Skin Care Kit', nameHindi: 'Herbon Skin Care Kit',
        category: 'Combo', price: 849, mrp: 1299,
        description: 'Complete skin care combo - Cream + Face Wash + Aloe Gel',
        benefits: ['Complete routine', 'Save 35%', 'Gift pack', 'All skin types'],
        ingredients: 'Face Cream + Face Wash + Aloe Vera Gel combo',
        bestSeller: false, tags: ['combo', 'skin', 'kit']
    }
];

// ==================== SEED PRODUCTS ====================
router.post('/products/seed', async (req, res) => {
    try {
        let seeded = 0, skipped = 0;
        for (const p of SEED_PRODUCTS) {
            const exists = await Product.findOne({ productId: p.productId });
            if (!exists) {
                await Product.create(p);
                seeded++;
            } else {
                skipped++;
            }
        }
        res.json({ success: true, message: `Seeded ${seeded} products, ${skipped} already existed`, total: SEED_PRODUCTS.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET ALL PRODUCTS ====================
router.get('/products', async (req, res) => {
    try {
        const { category, active, bestSeller } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (active !== undefined) filter.isActive = active === 'true';
        if (bestSeller) filter.bestSeller = bestSeller === 'true';

        const products = await Product.find(filter).sort({ bestSeller: -1, category: 1, name: 1 });
        res.json({ success: true, products, count: products.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== ADD PRODUCT ====================
router.post('/products', async (req, res) => {
    try {
        const { name, price } = req.body;
        if (!name || !price) return res.status(400).json({ success: false, message: 'Name and price required' });

        const productId = 'HRB-' + Date.now().toString().slice(-6);
        const product = await Product.create({ ...req.body, productId });
        res.json({ success: true, product, message: 'Product added!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== UPDATE PRODUCT ====================
router.patch('/products/:id', async (req, res) => {
    try {
        // Only allow whitelisted fields to be updated
        const allowedFields = ['name', 'nameHindi', 'category', 'price', 'mrp', 'description', 'benefits', 'ingredients', 'imageUrl', 'isActive', 'bestSeller', 'tags'];
        const updateData = {};
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                updateData[key] = req.body[key];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        const product = await Product.findOneAndUpdate(
            { productId: req.params.id },
            { $set: updateData },
            { new: true }
        );
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== DELETE PRODUCT ====================
router.delete('/products/:id', async (req, res) => {
    try {
        await Product.findOneAndDelete({ productId: req.params.id });
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== GET PRODUCT CATALOG FOR AI ====================
// Returns formatted string for injection into AI system prompt
router.get('/products/ai-catalog', async (req, res) => {
    try {
        const products = await Product.find({ isActive: true }).sort({ bestSeller: -1 });
        const catalog = products.map(p => {
            const discount = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0;
            return `• ${p.name} (${p.category}) — ₹${p.price}${p.mrp ? ` (MRP ₹${p.mrp}, ${discount}% off)` : ''} ${p.bestSeller ? '⭐ BESTSELLER' : ''}\n  Benefits: ${(p.benefits || []).join(', ')}`;
        }).join('\n');
        res.json({ success: true, catalog, productCount: products.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
