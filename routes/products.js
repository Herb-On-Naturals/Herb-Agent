const express = require('express');
const router = express.Router();
const { Product } = require('../models');

// ==================== HERBON NATURALS PRODUCT CATALOG (FROM WEBSITE) ====================
const SEED_PRODUCTS = [
    // ========== HEART CARE / VARICOSE ==========
    {
        productId: 'p1', name: 'Herbon Vedic Capsule', nameHindi: 'हर्बोन वैदिक कैप्सूल',
        category: 'Heart Care', price: 1399, mrp: 1399,
        description: 'Holistic immunity & vitality capsule. Ayurvedic Rasayana for deep immunity, energy, and cellular rejuvenation.',
        benefits: ['Immunity booster (Ojas restoration)', 'Chronic fatigue relief', 'Respiratory system support', 'Anti-aging antioxidant defense', 'Cognitive clarity & stress adaptation', 'Lab-tested & GMP certified'],
        ingredients: 'Ashwagandha, Giloy, Amla, Tulsi, Shatavari, Brahmi, Mulethi — classical Rasayana blend',
        bestSeller: true, tags: ['heart-care', 'immunity', 'capsule', 'bestseller'],
        imageUrl: '/product.html?id=p1', size: '60 Capsules',
        usage: 'Subah-shaam 1-1 capsule gungune paani ya doodh ke saath lein. Kam se kam 3-6 mahine regular use karein.',
        idealFor: 'Low immunity, fatigue, frequent infections, overall health maintenance'
    },
    {
        productId: 'p5', name: 'Herb On Pain Snap Prash (Blue Label)', nameHindi: 'हर्ब ऑन पेन स्नैप प्राश',
        category: 'Heart Care', price: 2499, mrp: 2499,
        description: 'Premium Ayurvedic prash for cardiovascular health, vein strength, and musculoskeletal pain relief.',
        benefits: ['Varicose vein relief', 'Blood circulation improvement', 'Vein wall strengthening', 'Musculoskeletal pain support', 'Heart health tonic', 'Natural anti-inflammatory'],
        ingredients: 'Arjuna, Ashwagandha, Triphala, Guggul, Shilajit, Honey base — premium Chyawanprash variant',
        bestSeller: true, tags: ['heart-care', 'varicose', 'prash', 'pain'],
        imageUrl: '/product.html?id=p5', size: '500g',
        usage: '1-2 chammach subah khaali pet gungune doodh ke saath lein. Regular 3 mahine use karein.',
        idealFor: 'Varicose veins, poor blood circulation, heart weakness, chronic body pain'
    },
    {
        productId: 'p6', name: 'Herbon Plus Capsule (Naskhol)', nameHindi: 'हर्बोन प्लस कैप्सूल (नासखोल)',
        category: 'Heart Care', price: 1990, mrp: 1990,
        description: 'Advanced vascular health capsule for varicose veins, blood purification, and circulation support.',
        benefits: ['Varicose vein management', 'Blood purification', 'Vein elasticity improvement', 'Spider vein reduction', 'Leg heaviness & swelling relief', 'Deep vascular cleansing'],
        ingredients: 'Triphala, Guggul, Arjuna, Punarnava, Manjistha, Sariva — potent vein health formula',
        bestSeller: true, tags: ['heart-care', 'varicose', 'capsule', 'naskhol'],
        imageUrl: '/product.html?id=p6', size: '60 Capsules',
        usage: '1-1 capsule subah-shaam khaane ke baad paani ke saath. 3-6 mahine tak lein.',
        idealFor: 'Varicose veins, spider veins, leg heaviness, poor venous circulation'
    },
    {
        productId: 'p16', name: 'Herbon Vena-V Capsules', nameHindi: 'हर्बोन वेना-V कैप्सूल',
        category: 'Heart Care', price: 1599, mrp: 1599,
        description: 'Advanced vascular support capsules for healthy blood circulation and varicose vein management.',
        benefits: ['Varicose vein treatment support', 'Blood circulation booster', 'Vein wall strengthening', 'Leg pain & cramp relief', 'Spider vein reduction', 'Anti-inflammatory vascular action'],
        ingredients: 'Arjuna, Triphala, Guggul, Punarnava, Gotu Kola, Manjistha',
        bestSeller: true, tags: ['heart-care', 'varicose', 'capsule', 'vena'],
        imageUrl: '/product.html?id=p16', size: '60 Capsules',
        usage: '1-1 capsule subah-shaam khaane ke baad paani ke saath lein.',
        idealFor: 'Varicose veins, blood circulation issues, vein health'
    },
    {
        productId: 'p19', name: 'Herbon Vains Clean Capsules', nameHindi: 'हर्बोन वेन्स क्लीन कैप्सूल',
        category: 'Heart Care', price: 1599, mrp: 1599,
        description: 'Deep vascular cleansing capsules for vein detox and healthy blood flow.',
        benefits: ['Deep vein cleansing', 'Blood flow optimization', 'Toxin removal from veins', 'Vein elasticity restoration', 'Heaviness & numbness relief', 'Cardiovascular support'],
        ingredients: 'Kanchnar, Guggul, Punarnava, Triphala, Arjuna, Manjistha',
        bestSeller: false, tags: ['heart-care', 'varicose', 'capsule', 'cleansing'],
        imageUrl: '/product.html?id=p19', size: '60 Capsules',
        usage: '1-1 capsule subah-shaam khaane ke baad paani ke saath.',
        idealFor: 'Blocked veins, vein toxicity, varicose veins, deep vascular issues'
    },
    {
        productId: 'p20', name: 'Herbon Nadi Yog Capsule', nameHindi: 'हर्बोन नाड़ी योग कैप्सूल',
        category: 'Heart Care', price: 1460, mrp: 1460,
        description: 'Nerve & joint vitality capsule for cardiovascular and nervous system health.',
        benefits: ['Nerve health restoration', 'Joint vitality support', 'Blood vessel strengthening', 'Numbness & tingling relief', 'Nadi (nerve channel) cleansing', 'Vata dosha balancing'],
        ingredients: 'Ashwagandha, Bala, Rasna, Guggul, Maharasnadi — classical Nadi formulation',
        bestSeller: true, tags: ['heart-care', 'nerve', 'joint', 'capsule', 'nadiyog'],
        imageUrl: '/product.html?id=p20', size: '60 Capsules',
        usage: '1-1 capsule subah-shaam khaane ke baad gungune paani se lein.',
        idealFor: 'Nerve weakness, numbness, tingling, varicose veins with nerve issues'
    },
    {
        productId: 'p23', name: "Herbon Vain's (Honey & Ras)", nameHindi: 'हर्बोन वेन्स (हनी & रस)',
        category: 'Heart Care', price: 2499, mrp: 2499,
        description: 'Heart wellness formulation with honey base for healthy blood circulation and vein care.',
        benefits: ['Heart health tonic', 'Varicose vein support', 'Natural honey-based formula', 'Blood purification', 'Vein nourishment', 'Cholesterol management support'],
        ingredients: 'Pure Honey, Arjuna, Triphala, Saffron, Amla, Dalchini — royal heart tonic',
        bestSeller: false, tags: ['heart-care', 'honey', 'varicose', 'heart'],
        imageUrl: '/product.html?id=p23', size: '500g',
        usage: '1-2 chammach subah khaali pet gungune paani ya doodh ke saath.',
        idealFor: 'Heart weakness, varicose veins, blood impurities, cholesterol concerns'
    },

    // ========== JOINT PAIN ==========
    {
        productId: 'p7', name: 'Herbon Paingesic Oil Liniment', nameHindi: 'हर्बोन पेनजेसिक ऑयल',
        category: 'Joint Pain', price: 799, mrp: 799,
        description: 'Fast-acting Ayurvedic pain relief oil for joint pain, muscle stiffness, and arthritis.',
        benefits: ['Instant joint pain relief', 'Muscle stiffness reduction', 'Arthritis support', 'Deep tissue penetration', 'Anti-inflammatory action', 'Improved mobility'],
        ingredients: 'Mahanarayan Oil, Nirgundi, Eucalyptus, Camphor, Ajwain, Turpentine Oil',
        bestSeller: true, tags: ['joint-pain', 'oil', 'pain-relief', 'bestseller'],
        imageUrl: '/product.html?id=p7', size: '100ml',
        usage: 'Dard wali jagah par lagakar 5-10 min halka massage karein. Din mein 2-3 baar use karein.',
        idealFor: 'Joint pain, knee pain, back pain, muscle stiffness, arthritis, frozen shoulder'
    },
    {
        productId: 'p21', name: 'Herbon Paingesic Oil Liniment (Spray)', nameHindi: 'हर्बोन पेनजेसिक ऑयल स्प्रे',
        category: 'Joint Pain', price: 799, mrp: 799,
        description: 'Convenient spray format of Paingesic Oil for instant external joint and muscle pain relief.',
        benefits: ['Easy spray application', 'Quick absorption', 'Instant pain relief', 'No mess formula', 'Portable pain solution', 'Travel-friendly'],
        ingredients: 'Mahanarayan Oil, Nirgundi, Eucalyptus, Camphor, Ajwain — spray formulation',
        bestSeller: true, tags: ['joint-pain', 'spray', 'pain-relief', 'oil'],
        imageUrl: '/product.html?id=p21', size: '100ml',
        usage: 'Dard wali jagah par 3-4 baar spray karein aur halka massage karein. Din mein 2-3 baar.',
        idealFor: 'Joint pain, muscle pain, sports injury, back pain, travel ke liye convenient'
    },
    {
        productId: 'p18', name: 'Herbon Pain Over Capsules', nameHindi: 'हर्बोन पेन ओवर कैप्सूल',
        category: 'Joint Pain', price: 960, mrp: 960,
        description: 'Powerful Ayurvedic capsules for rapid musculoskeletal relief from arthritis and joint stiffness.',
        benefits: ['Deep internal pain relief', 'Cartilage rebuilding support', 'Anti-inflammatory herbs', 'Arthritis management', 'Mobility improvement', 'Bone strength support'],
        ingredients: 'Shallaki (Boswellia), Guggul, Ashwagandha, Rasna, Nirgundi, Hadjod',
        bestSeller: true, tags: ['joint-pain', 'capsule', 'pain-relief', 'arthritis'],
        imageUrl: '/product.html?id=p18', size: '60 Capsules',
        usage: '1-1 capsule subah-shaam khaane ke baad gungune paani se. 3 mahine regular use karein.',
        idealFor: 'Chronic joint pain, arthritis, knee pain, bone weakness, cartilage damage'
    },
    {
        productId: 'p28', name: 'Herbon Vedic Plus Tablet', nameHindi: 'हर्बोन वैदिक प्लस टैबलेट',
        category: 'Joint Pain', price: 1199, mrp: 1199,
        description: 'Bone & joint strength tablets for musculoskeletal health and arthritis support.',
        benefits: ['Bone density improvement', 'Joint flexibility', 'Calcium absorption support', 'Cartilage nourishment', 'Stiffness reduction', 'Long-term joint health'],
        ingredients: 'Hadjod, Arjuna, Ashwagandha, Shatavari, Praval Pishti, Mukta Pishti',
        bestSeller: true, tags: ['joint-pain', 'tablet', 'bone', 'strength'],
        imageUrl: '/product.html?id=p28', size: '60 Tablets',
        usage: '1-1 tablet subah-shaam khaane ke baad doodh ya paani ke saath lein.',
        idealFor: 'Weak bones, osteoporosis risk, joint stiffness, calcium deficiency'
    },

    // ========== IMMUNITY ==========
    {
        productId: 'p9', name: 'Herbon Tulsi Paawan', nameHindi: 'हर्बोन तुलसी पावन',
        category: 'Immunity', price: 1, mrp: 1,
        description: 'Pure Five-Tulsi concentrate — ultimate Ayurvedic immunity booster and Rasayana.',
        benefits: ['Pathogen resistance builder', 'Respiratory system support', 'Anti-oxidant rich', 'Energy & vitality booster', 'Stress adaptation (Adaptogenic)', 'Cellular anti-aging'],
        ingredients: 'Panch Tulsi (5 types of Tulsi) — Ram Tulsi, Shyam Tulsi, Van Tulsi, Vishnu Tulsi, Nimbu Tulsi',
        bestSeller: false, tags: ['immunity', 'tulsi', 'drops'],
        imageUrl: '/product.html?id=p9', size: '24ml',
        usage: '3-5 boondein gungune paani ya chai mein subah-shaam. Daily immunity ke liye.',
        idealFor: 'Low immunity, seasonal infections, cough-cold prone, respiratory weakness'
    },
    {
        productId: 'p10', name: 'Herbon Urja Rasayan Capsule', nameHindi: 'हर्बोन ऊर्जा रसायन कैप्सूल',
        category: 'Immunity', price: 1590, mrp: 1590,
        description: 'Energy, focus & rejuvenation capsule — classical Rasayana for deep immunity and vitality.',
        benefits: ['Deep immunity building', 'Energy & stamina boost', 'Mental clarity & focus', 'Anti-fatigue formula', 'Ojas restoration', 'Respiratory fortification'],
        ingredients: 'Ashwagandha, Shatavari, Amla, Giloy, Pippali, Brahmi — Rasayana blend',
        bestSeller: true, tags: ['immunity', 'energy', 'capsule', 'rasayana'],
        imageUrl: '/product.html?id=p10', size: '60 Capsules',
        usage: '1-1 capsule subah-shaam khaane ke baad gungune paani ya doodh se.',
        idealFor: 'Low energy, weak immunity, mental fog, chronic tiredness, post-illness recovery'
    },
    {
        productId: 'p11', name: 'Herbon Daibayog Cap', nameHindi: 'हर्बोन दैबायोग कैप्सूल',
        category: 'Immunity', price: 780, mrp: 780,
        description: 'Ayurvedic diabetes & metabolism support capsule for blood sugar management.',
        benefits: ['Blood sugar regulation support', 'Pancreas health', 'Insulin sensitivity improvement', 'Metabolic balance', 'Anti-diabetic herbs', 'Energy without sugar spikes'],
        ingredients: 'Karela, Jamun, Methi, Gudmar, Neem, Vijaysar, Shilajit',
        bestSeller: false, tags: ['immunity', 'diabetes', 'sugar', 'capsule'],
        imageUrl: '/product.html?id=p11', size: '60 Capsules',
        usage: '1-1 capsule subah-shaam khaane se 30 min pehle paani ke saath.',
        idealFor: 'Pre-diabetes, blood sugar management, metabolic syndrome, diabetes support'
    },
    {
        productId: 'p17', name: 'Herbon Tulsi Paawan (Supralas)', nameHindi: 'हर्बोन तुलसी पावन (सुप्रालस)',
        category: 'Immunity', price: 1599, mrp: 1599,
        description: 'Premium anti-oxidant & Rasayan — concentrated Tulsi extract for maximum immunity and wellness.',
        benefits: ['Premium anti-oxidant formula', 'Deep Rasayana effect', 'Respiratory immunity', 'Anti-viral & anti-bacterial', 'Liver detox support', 'Hormonal balance support'],
        ingredients: 'Panch Tulsi concentrate, Amla, Giloy, Mulethi, Honey — Supralas formulation',
        bestSeller: false, tags: ['immunity', 'tulsi', 'premium', 'supralas'],
        imageUrl: '/product.html?id=p17', size: '51ml',
        usage: '5-10 boondein gungune paani mein subah khaali pet. Premium immunity ke liye.',
        idealFor: 'Strong immunity building, respiratory health, seasonal protection, detox'
    },

    // ========== MEN\'S HEALTH ==========
    {
        productId: 'p12', name: 'Herbon Natural Shilajit', nameHindi: 'हर्बोन नैचुरल शिलाजीत',
        category: "Men's Health", price: 1499, mrp: 1499,
        description: 'Himalayan vitality & power — pure natural Shilajit for men\'s strength, stamina, and peak performance.',
        benefits: ['Testosterone support', 'Stamina & endurance boost', 'Muscle strength building', 'Energy & vitality increase', 'Anti-aging mineral complex', 'Reproductive health support'],
        ingredients: 'Pure Himalayan Shilajit resin — 80+ minerals, Fulvic acid, Humic acid',
        bestSeller: true, tags: ['mens-health', 'shilajit', 'strength', 'bestseller'],
        imageUrl: '/product.html?id=p12', size: '30g',
        usage: 'Chane ke daane jitna (pea-size) subah khaali pet gungune doodh ya paani mein ghol kar lein.',
        idealFor: 'Low energy, weakness, stamina issues, men over 30, gym/fitness enthusiasts'
    },
    {
        productId: 'p25', name: 'Herbon Gold Vitality Capsule', nameHindi: 'हर्बोन गोल्ड वाइटैलिटी कैप्सूल',
        category: "Men's Health", price: 1299, mrp: 1299,
        description: 'Pleasure beyond satisfaction — premium Ayurvedic vitality capsule for men\'s wellness and peak performance.',
        benefits: ['Male vitality enhancement', 'Stamina & power boost', 'Testosterone optimization', 'Stress & cortisol control', 'Immune & organ fortification', 'Mental focus & clarity'],
        ingredients: 'Ashwagandha, Safed Musli, Kaunch Beej, Shilajit, Shatavari, Gokshura, Akarkara',
        bestSeller: true, tags: ['mens-health', 'vitality', 'capsule', 'gold'],
        imageUrl: '/product.html?id=p25', size: '60 Capsules',
        usage: '1-1 capsule subah-shaam doodh ke saath lein. Best results ke liye 3 mahine use karein.',
        idealFor: 'Men\'s vitality, stamina, strength, reproductive health, performance enhancement'
    },
    {
        productId: 'p27', name: 'Herbon Essential Oil', nameHindi: 'हर्बोन एसेंशियल ऑयल',
        category: "Men's Health", price: 1200, mrp: 1200,
        description: 'Fast external relief oil for men — premium men\'s wellness and joint support oil.',
        benefits: ['Quick external relief', 'Men\'s wellness support', 'Muscle relaxation', 'Targeted pain relief', 'Deep tissue penetration', 'Natural warming effect'],
        ingredients: 'Ashwagandha Oil, Sesame Oil, Camphor, Eucalyptus, Jaiphal, Lavang',
        bestSeller: false, tags: ['mens-health', 'oil', 'essential'],
        imageUrl: '/product.html?id=p27', size: '24ml',
        usage: 'Required area par 5-10 boondein lagakar halka massage karein.',
        idealFor: 'Men\'s external wellness, muscle tension, targeted relief'
    },

    // ========== WEIGHT LOSS ==========
    {
        productId: 'p14', name: 'Herbon Weight Manage Capsule', nameHindi: 'हर्बोन वेट मैनेज कैप्सूल',
        category: 'Weight Loss', price: 960, mrp: 960,
        description: 'Natural metabolic support — Ayurvedic weight management capsule for metabolism boost and fat burn.',
        benefits: ['Metabolism acceleration', 'Fat burning support', 'Appetite regulation', 'Digestive improvement', 'Toxin flush', 'Energy without crash'],
        ingredients: 'Medohar Guggul, Triphala, Garcinia, Methi, Ajwain, Dalchini, Pippali',
        bestSeller: true, tags: ['weight-loss', 'capsule', 'metabolism'],
        imageUrl: '/product.html?id=p14', size: '60 Capsules',
        usage: '1-1 capsule subah-shaam khaane se 30 min pehle gungune paani ke saath.',
        idealFor: 'Weight management, slow metabolism, belly fat, obesity support'
    },
    {
        productId: 'p15', name: 'Slim Fit Prash (Herbon Digesto Prash)', nameHindi: 'स्लिम फिट प्राश',
        category: 'Weight Loss', price: 1333, mrp: 1333,
        description: 'Digestive slimming formula — Ayurvedic prash for weight loss through improved digestion and metabolism.',
        benefits: ['Digestive fire (Agni) activation', 'Natural fat metabolism', 'Gut health improvement', 'Bloating reduction', 'Appetite control', 'Detox & cleansing'],
        ingredients: 'Triphala, Honey, Amla, Haritaki, Pippali, Ajwain, Saunf — Digesto prash base',
        bestSeller: true, tags: ['weight-loss', 'prash', 'digestion', 'slimming'],
        imageUrl: '/product.html?id=p15', size: '500g',
        usage: '1-2 chammach subah khaali pet gungune paani ke saath. Regular 3 mahine use karein.',
        idealFor: 'Digestive issues with weight gain, slow metabolism, bloated stomach, constipation'
    },
    {
        productId: 'p22', name: 'Herbon SHAPE (Slimming Formula)', nameHindi: 'हर्बोन शेप (स्लिमिंग फॉर्मूला)',
        category: 'Weight Loss', price: 3300, mrp: 3300,
        description: 'Advanced fat management — premium complete slimming solution with 60+30 capsule combo.',
        benefits: ['Advanced fat burning', 'Body shaping support', 'Stubborn fat targeting', 'Metabolism supercharger', 'Inch loss support', 'Complete slimming program'],
        ingredients: 'Garcinia Cambogia, Green Coffee, Medohar Guggul, Triphala, Vidanga, Chitrak',
        bestSeller: true, tags: ['weight-loss', 'slimming', 'premium', 'shape'],
        imageUrl: '/product.html?id=p22', size: '60+30 Capsules',
        usage: '60 capsule pack se 1-1 subah-shaam + 30 capsule booster pack se 1 raat ko. Full course 3 mahine.',
        idealFor: 'Serious weight loss goals, stubborn fat, body shaping, premium slimming'
    },

    // ========== HERBAL TEA ==========
    {
        productId: 'p2', name: 'Herbon Herbal Green Tea', nameHindi: 'हर्बोन हर्बल ग्रीन टी',
        category: 'Herbal Tea', price: 399, mrp: 399,
        description: 'Daily wellness herbal green tea for lightfresh immunity and metabolism support.',
        benefits: ['Daily detox', 'Metabolism boost', 'Antioxidant rich', 'Caffeine-free energy', 'Digestive support', 'Refreshing taste'],
        ingredients: 'Green Tea, Tulsi, Lemongrass, Ginger, Ashwagandha',
        bestSeller: false, tags: ['herbal-tea', 'green-tea', 'daily'],
        imageUrl: '/product.html?id=p2', size: '100g',
        usage: '1 chammach chai patti ko garam paani mein 3-5 min steep karein. Din mein 2-3 cup piyein.',
        idealFor: 'Daily wellness, light detox, metabolism boost, tea lovers'
    },
    {
        productId: 'p24', name: 'Herbon Herbal Tea (15 Herbs)', nameHindi: 'हर्बोन हर्बल टी (15 जड़ी-बूटी)',
        category: 'Herbal Tea', price: 1590, mrp: 1590,
        description: 'Daily detox & immunity — premium 15-herb blend for comprehensive wellness and metabolism.',
        benefits: ['15 powerful herbs', 'Deep body detox', 'Strong immunity boost', 'Digestive fire activation', 'Weight management support', 'Anti-inflammatory'],
        ingredients: '15 Ayurvedic herbs — Tulsi, Dalchini, Saunf, Ajwain, Mulethi, Brahmi, Ashwagandha, Amla, Giloy, Haldi, Adrak, Elaichi, Kali Mirch, Tej Patta, Lemongrass',
        bestSeller: true, tags: ['herbal-tea', '15-herbs', 'premium'],
        imageUrl: '/product.html?id=p24', size: '114g',
        usage: '1 chammach ko garam paani mein 5 min steep karein. Subah-shaam piyein.',
        idealFor: 'Deep detox, immunity building, digestion, daily wellness ritual'
    },
    {
        productId: 'p26', name: 'Herbon Premium Herbal Tea (36 Herbs)', nameHindi: 'हर्बोन प्रीमियम हर्बल टी (36 जड़ी-बूटी)',
        category: 'Herbal Tea', price: 1850, mrp: 1850,
        description: 'Ultimate 36-herb antioxidant tea — the most comprehensive Ayurvedic herbal tea blend for total body wellness.',
        benefits: ['36 powerful herbs', 'Ultimate antioxidant power', 'Complete body detox', 'Maximum immunity shield', 'Anti-aging benefits', 'Hormonal balance support'],
        ingredients: '36 Ayurvedic herbs — includes all 15-herb blend PLUS Shatavari, Safed Musli, Jatamansi, Arjuna, Punarnava, Guduchi, Shankhpushpi, Vidanga, Chitrak, Haritaki + more',
        bestSeller: true, tags: ['herbal-tea', '36-herbs', 'super-premium', 'bestseller'],
        imageUrl: '/product.html?id=p26', size: '105g',
        usage: '1 chammach garam paani mein 5-7 min steep. Subah khaali pet best results. Din mein 2 cup.',
        idealFor: 'Maximum wellness, premium detox, anti-aging, chronic health issues, health enthusiasts'
    },

    // ========== COMBO KITS ==========
    {
        productId: 'c5', name: 'Triple Action Joint & Varicose Relief Combo', nameHindi: 'ट्रिपल एक्शन जॉइंट & वैरिकोस कॉम्बो',
        category: 'Combo', price: 1600, mrp: 2400,
        description: 'Specialized 3-bottle Ayurvedic oil pack for severe joint pain and varicose vein relief.',
        benefits: ['Joint + varicose combined care', 'Save ₹800 (33% off)', 'Triple action formula', 'Internal + external relief', 'Complete pain management', '3-bottle set'],
        ingredients: 'Paingesic Oil + Vein Care Oil + Ortho Support Oil — triple pack',
        bestSeller: true, tags: ['combo', 'joint-pain', 'varicose', 'bestseller'],
        imageUrl: '/product.html?id=c5', size: '3 Bottles Set',
        usage: 'Har oil ko respective area par din mein 2 baar lagakar massage karein.',
        idealFor: 'Joint pain + varicose veins together, severe pain, complete external care'
    },
    {
        productId: 'c6', name: 'Nadiyog & Relief Oil Combo', nameHindi: 'नाड़ीयोग & रिलीफ ऑयल कॉम्बो',
        category: 'Combo', price: 1999, mrp: 2259,
        description: 'Perfect synergy combo — Nadiyog capsules for internal nerve strength + potent relief oil for external pain.',
        benefits: ['Internal + external action', 'Nerve health + pain relief', 'Save ₹260', 'Synergistic formula', 'Complete relief solution', 'Capsule + Oil combo'],
        ingredients: 'Nadi Yog Capsules (60) + Paingesic Relief Oil (100ml)',
        bestSeller: true, tags: ['combo', 'nerve', 'pain', 'nadiyog'],
        imageUrl: '/product.html?id=c6', size: '60 Caps + 100ml Oil',
        usage: 'Capsule subah-shaam + Oil din mein 2-3 baar massage.',
        idealFor: 'Nerve + joint pain combined, numbness with pain, complete nerve care'
    },
    {
        productId: 'c7', name: 'Nadiyog & Naskhol Vitality Combo', nameHindi: 'नाड़ीयोग & नासखोल वाइटैलिटी कॉम्बो',
        category: 'Combo', price: 2499, mrp: 4249,
        description: 'Premium trio for cardiovascular health, nerve vitality, and musculoskeletal relief.',
        benefits: ['Heart + nerve + joint care', 'Save ₹1750 (41% off)', 'Premium 3-product combo', 'Cardiovascular support', 'Nerve vitality boost', 'Complete wellness package'],
        ingredients: 'Nadi Yog Capsules + Naskhol Plus Capsules + Ayurvedic Relief Oil',
        bestSeller: true, tags: ['combo', 'heart', 'nerve', 'premium', 'bestseller'],
        imageUrl: '/product.html?id=c7', size: '2 Caps + 1 Oil',
        usage: 'Dono capsules subah-shaam + Oil din mein 2 baar massage.',
        idealFor: 'Varicose veins + nerve issues + joint pain — complete solution'
    },
    {
        productId: 'c8', name: 'Painover & Ortho Oil Combo', nameHindi: 'पेनओवर & ऑर्थो ऑयल कॉम्बो',
        category: 'Combo', price: 1499, mrp: 1759,
        description: 'Advanced joint pain solution — Painover capsules for deep internal healing + Ortho oil for rapid external relief.',
        benefits: ['Internal + external pain relief', 'Save ₹260', 'Chronic pain management', 'Capsule + Oil synergy', 'Arthritis support combo', 'Complete joint care'],
        ingredients: 'Pain Over Capsules (60) + Paingesic Ortho Oil (100ml)',
        bestSeller: true, tags: ['combo', 'joint-pain', 'pain', 'ortho'],
        imageUrl: '/product.html?id=c8', size: '60 Caps + 100ml Oil',
        usage: 'Capsule subah-shaam khaane ke baad + Oil din mein 2-3 baar dard wali jagah par.',
        idealFor: 'Chronic joint pain, arthritis, knee pain — complete internal + external treatment'
    }
];

// ==================== SEED PRODUCTS ====================
router.post('/products/seed', async (req, res) => {
    try {
        const { force } = req.body || {};
        let seeded = 0, skipped = 0, updated = 0;

        if (force) {
            // Force reseed: delete all old products and insert fresh from website data
            await Product.deleteMany({});
            for (const p of SEED_PRODUCTS) {
                await Product.create(p);
                seeded++;
            }
            return res.json({ success: true, message: `🔄 Force reseeded ${seeded} products (old data cleared)`, total: SEED_PRODUCTS.length });
        }

        for (const p of SEED_PRODUCTS) {
            const exists = await Product.findOne({ productId: p.productId });
            if (!exists) {
                await Product.create(p);
                seeded++;
            } else {
                // Update existing product with new fields
                await Product.findOneAndUpdate({ productId: p.productId }, { $set: p });
                updated++;
            }
        }
        res.json({ success: true, message: `Seeded ${seeded} new, updated ${updated} existing products`, total: SEED_PRODUCTS.length });
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
