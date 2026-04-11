const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { Order } = require('../models');

// Multer config — store in uploads/ folder
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, 'upload-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.xlsx', '.xls', '.csv'].includes(ext)) cb(null, true);
        else cb(new Error('Only .xlsx, .xls, .csv files allowed'));
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// ==================== UPLOAD EXCEL ====================
router.post('/upload-excel', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        // Read the Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rows.length) {
            return res.status(400).json({ success: false, message: 'Excel file is empty' });
        }

        // Show available columns for mapping info
        const columns = Object.keys(rows[0]);

        // Map Excel columns to Order fields (flexible matching)
        const columnMap = buildColumnMap(columns);

        let imported = 0;
        let skipped = 0;
        let errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const customerName = getVal(row, columnMap.customerName);
                const mobile = cleanMobile(getVal(row, columnMap.mobile));

                // Concatenate address components
                let address = getVal(row, columnMap.address);
                const add1 = getVal(row, columnMap.add1);
                const add2 = getVal(row, columnMap.add2);
                const add3 = getVal(row, columnMap.add3);

                const addrParts = [address, add1, add2, add3].filter(p => p && p.length > 0);
                const fullAddress = addrParts.join(', ').substring(0, 500) || 'N/A';

                const state = getVal(row, columnMap.state) || 'Unknown';

                // Skip rows without essential data
                if (!customerName && !mobile) {
                    skipped++;
                    continue;
                }

                // Check for duplicate by orderId if present
                const existingOrderId = getVal(row, columnMap.orderId);
                if (existingOrderId) {
                    const exists = await Order.findOne({ orderId: existingOrderId });
                    if (exists) { skipped++; continue; }
                }

                // Financials
                const total = parseFloat(getVal(row, columnMap.total) || getVal(row, columnMap.amount)) || 0;
                const advance = parseFloat(getVal(row, columnMap.advance)) || 0;
                const codAmount = Math.max(0, total - advance);

                // Build items (Handle comma-separated product names)
                const items = [];
                const itemDescRaw = getVal(row, columnMap.itemDescription) || getVal(row, columnMap.treatment) || getVal(row, columnMap.product);
                const itemQty = parseInt(getVal(row, columnMap.quantity)) || 1;
                const itemPrice = parseFloat(getVal(row, columnMap.price) || getVal(row, columnMap.rate)) || (total / (itemQty || 1));

                if (itemDescRaw) {
                    // split by comma if multiple products
                    const productNames = itemDescRaw.split(',').map(p => p.trim()).filter(p => p.length > 0);
                    const qtyPerProduct = Math.max(1, Math.floor(itemQty / productNames.length));

                    productNames.forEach(name => {
                        items.push({
                            description: name,
                            quantity: qtyPerProduct,
                            price: Math.round(itemPrice / productNames.length),
                            rate: Math.round(itemPrice / productNames.length),
                            amount: Math.round((itemQty * itemPrice) / productNames.length)
                        });
                    });
                }

                const awb = getVal(row, columnMap.awb);
                const now = new Date().toISOString();

                const order = new Order({
                    orderId: existingOrderId || ('EXCEL-' + Date.now() + '-' + i),
                    timestamp: getVal(row, columnMap.date) || now,
                    employee: getVal(row, columnMap.employee) || 'Excel Import',
                    employeeId: getVal(row, columnMap.employeeId) || 'EXCEL',
                    customerName: customerName || 'Unknown',
                    telNo: mobile,
                    mobile: mobile,
                    altNo: getVal(row, columnMap.altNo),
                    email: getVal(row, columnMap.email),
                    address: fullAddress,
                    hNo: getVal(row, columnMap.hNo),
                    villColony: getVal(row, columnMap.villColony) || getVal(row, columnMap.colony),
                    landmark: getVal(row, columnMap.landmark) || add3,
                    city: getVal(row, columnMap.city),
                    state: state,
                    pin: getVal(row, columnMap.pin) || getVal(row, columnMap.pincode),
                    pincode: getVal(row, columnMap.pincode) || getVal(row, columnMap.pin),
                    distt: getVal(row, columnMap.district),
                    orderType: getVal(row, columnMap.orderType) || 'Excel Import',
                    date: getVal(row, columnMap.date) || now.split('T')[0],
                    treatment: getVal(row, columnMap.treatment),
                    paymentMode: getVal(row, columnMap.paymentMode) || 'COD',
                    total: total,
                    advance: advance,
                    codAmount: codAmount,
                    items: items,
                    status: getVal(row, columnMap.status) || 'Delivered',
                    deliveredAt: getVal(row, columnMap.deliveredAt) || now,
                    shiprocket: { awb: awb },
                    tracking: { trackingId: awb },
                    remarks: [{
                        text: 'Imported from Excel',
                        addedBy: 'Sales Agent',
                        addedAt: now,
                        timestamp: now
                    }]
                });

                await order.save();
                imported++;
            } catch (rowErr) {
                console.error(`Row error:`, rowErr);
                errors.push(`Row ${i + 2}: ${rowErr.message}`);
                skipped++;
            }
        }

        // Cleanup uploaded file
        try { fs.unlinkSync(req.file.path); } catch (e) { }

        res.json({
            success: true,
            message: `Import complete! ${imported} orders imported, ${skipped} skipped`,
            stats: { imported, skipped, totalRows: rows.length, errors: errors.slice(0, 10) },
            columns: columns,
            mapping: columnMap
        });
    } catch (err) {
        console.error('❌ Excel upload error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==================== COLUMN MAPPING ====================
function buildColumnMap(columns) {
    const map = {};
    const lowerCols = columns.map(c => c.toLowerCase().trim());

    const patterns = {
        orderId: ['orderid', 'order id', 'order_id', 'id', 'sr', 'sr.', 'sno', 's.no', 'serial'],
        customerName: ['customername', 'customer name', 'customer_name', 'name', 'naam', 'client', 'customer'],
        mobile: ['mobile', 'phone', 'tel', 'telno', 'tel no', 'telephone', 'contact', 'mob', 'number', 'phone number', 'mobile no', 'mobile number'],
        altNo: ['altno', 'alt no', 'alternate', 'alt mobile', 'alternate number'],
        email: ['email', 'e-mail', 'emailid'],
        address: ['address', 'full address', 'addr', 'pata', 'fulladdress', 'full_address'],
        hNo: ['hno', 'h.no', 'house', 'house no', 'houseno'],
        villColony: ['colony', 'vill', 'village', 'villcolony', 'vill/colony', 'mohalla', 'area'],
        landmark: ['landmark', 'land mark', 'near', 'nearby'],
        city: ['city', 'town', 'sheher'],
        state: ['state', 'province', 'rajya'],
        pin: ['pin', 'pincode', 'zip', 'zipcode', 'postal', 'postalcode', 'postal code', 'pin code'],
        pincode: ['pincode', 'pin code', 'zip code'],
        district: ['district', 'distt', 'dist', 'jila'],
        itemDescription: ['item', 'items', 'description', 'product', 'medicine', 'dwa', 'product name', 'item description', 'itemdescription'],
        treatment: ['treatment', 'ilaj', 'disease', 'bimari'],
        product: ['product', 'product name', 'productname', 'item'],
        quantity: ['quantity', 'qty', 'matra', 'count'],
        price: ['price', 'rate', 'mrp', 'cost', 'keemat', 'unit price'],
        rate: ['rate'],
        total: ['total', 'amount', 'grand total', 'grandtotal', 'totalamount', 'total amount', 'bill', 'amount rs'],
        amount: ['amount', 'amt', 'amount rs'],
        advance: ['advance', 'advance payment', 'advancepaid', 'prepaid'],
        employee: ['employee', 'agent', 'salesperson', 'executive', 'caller'],
        employeeId: ['employeeid', 'employee id', 'emp id', 'empid'],
        paymentMode: ['payment', 'paymentmode', 'payment mode', 'pay mode', 'paymode', 'cod/prepaid', 'payment method'],
        status: ['status', 'order status', 'orderstatus', 'delivery status'],
        date: ['date', 'orderdate', 'order date', 'tarikh', 'timestamp'],
        deliveredAt: ['deliveredat', 'delivered at', 'delivery date', 'delivered date', 'deliverydate'],
        orderType: ['ordertype', 'order type', 'type'],
        awb: ['awb', 'awb number', 'tracking', 'tracking id', 'lr number', 'consignment'],
        add1: ['add1', 'address1', 'area'],
        add2: ['add2', 'address2', 'locality'],
        add3: ['add3', 'address3', 'landmark']
    };

    for (const [field, keywords] of Object.entries(patterns)) {
        for (const kw of keywords) {
            const idx = lowerCols.findIndex(c => c === kw || c.replace(/[^a-z0-9]/g, '') === kw.replace(/[^a-z0-9]/g, ''));
            if (idx !== -1) {
                map[field] = columns[idx]; // Use original case column name
                break;
            }
        }
    }

    return map;
}

function getVal(row, columnName) {
    if (!columnName) return '';
    const val = row[columnName];
    if (val === undefined || val === null) return '';
    return String(val).trim();
}

function cleanMobile(mobile) {
    if (!mobile) return '';
    return mobile.replace(/[^0-9+]/g, '').replace(/^(\+91|91)/, '');
}

// ==================== DOWNLOAD SAMPLE TEMPLATE ====================
router.get('/download-template', (req, res) => {
    const sampleData = [
        {
            'Order ID': 'SAMPLE-001',
            'Customer Name': 'Rahul Sharma',
            'Mobile': '9876543210',
            'Address': '123, MG Road, Sector 5',
            'City': 'Jaipur',
            'State': 'Rajasthan',
            'Pincode': '302001',
            'Product': 'Herbon Hair Oil',
            'Quantity': 2,
            'Price': 450,
            'Total': 900,
            'Payment Mode': 'COD',
            'Status': 'Delivered',
            'Delivered Date': '2026-02-10'
        },
        {
            'Order ID': 'SAMPLE-002',
            'Customer Name': 'Priya Singh',
            'Mobile': '9123456789',
            'Address': '456, Nehru Nagar',
            'City': 'Delhi',
            'State': 'Delhi',
            'Pincode': '110001',
            'Product': 'Herbon Skin Cream',
            'Quantity': 1,
            'Price': 650,
            'Total': 650,
            'Payment Mode': 'COD',
            'Status': 'Delivered',
            'Delivered Date': '2026-02-11'
        }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
        { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 30 },
        { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 20 },
        { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 14 },
        { wch: 12 }, { wch: 16 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.officedml');
    res.setHeader('Content-Disposition', 'attachment; filename=herbon_import_template.xlsx');
    res.send(buffer);
});

module.exports = router;
