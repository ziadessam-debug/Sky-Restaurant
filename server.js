const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;

// ================= Middleware =================
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Middleware للتحقق من الطلبات
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ================= Database =================
const db = new Database(path.join(__dirname, 'database.sqlite'));

// ================= Create Tables =================
db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  category TEXT,
  image TEXT,
  ingredients TEXT,
  rating REAL DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  popular INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  delivery_time TEXT,
  items TEXT NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  coupon_code TEXT,
  total REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  value REAL NOT NULL,
  min_order REAL DEFAULT 0,
  description TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// ================= Seed Products =================
const productCount = db
  .prepare('SELECT COUNT(*) AS count FROM products')
  .get();

if (productCount.count === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products
    (name, description, price, category, image, ingredients, popular)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    [
      'Burger',
      'Beef burger with cheese',
      50,
      'Fast Food',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
      JSON.stringify(['Beef', 'Cheese', 'Lettuce', 'Tomato']),
      1
    ],
    [
      'Pizza',
      'Cheese pizza',
      80,
      'Italian',
      'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&h=400&fit=crop',
      JSON.stringify(['Cheese', 'Dough', 'Tomato Sauce']),
      1
    ],
    [
      'Grilled Kebab',
      '400g beef kebab with special spices',
      65,
      'Grill',
      'https://tse2.mm.bing.net/th/id/OIP.fGBuHwmIfDvvJFvsHzh9AQHaHa?pid=Api&P=0&h=220',
      JSON.stringify(['Beef', 'Onion', 'Garlic', 'Spices', 'Parsley']),
      1
    ],
    [
      'Chicken Pasta',
      'Creamy pasta with grilled chicken and mushrooms',
      55,
      'Pasta',
      'https://tse1.mm.bing.net/th/id/OIP.GxokmxtUvWSO3Rxf5C3IwQHaJ4?pid=Api&P=0&h=220',
      JSON.stringify(['Pasta', 'Chicken', 'Cream', 'Mushrooms', 'Parmesan']),
      1
    ]
  ];

  const insertMany = db.transaction((rows) => {
    rows.forEach(row => insertProduct.run(...row));
  });

  insertMany(products);
  console.log('✅ Seeded products table');
}

// ================= Seed Coupons =================
const couponCount = db
  .prepare('SELECT COUNT(*) AS count FROM coupons')
  .get();

if (couponCount.count === 0) {
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (code, type, value, min_order, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  const coupons = [
    ['WELCOME10', 'percentage', 10, 0, '10% off on first order'],
    ['OFFER15', 'percentage', 15, 25, '15% off on orders above $25'],
    ['OFFER5', 'fixed', 5, 15, '$5 off on orders above $15'],
    ['SUPER20', 'percentage', 20, 40, '20% off on orders above $40'],
    ['QUICK10', 'percentage', 10, 20, '10% off for quick orders']
  ];

  const insertMany = db.transaction((rows) => {
    rows.forEach(row => insertCoupon.run(...row));
  });

  insertMany(coupons);
  console.log('✅ Seeded coupons table');
}

// ================= Test =================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sky Restaurant API</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { display: inline-block; padding: 3px 8px; border-radius: 3px; color: white; }
        .get { background: #4CAF50; }
        .post { background: #2196F3; }
        .patch { background: #FF9800; }
      </style>
    </head>
    <body>
      <h1>🚀 Sky Restaurant API</h1>
      <p>Server is running on port ${PORT}</p>
      
      <h2>📋 Available Endpoints:</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span> <strong>/api/products</strong> - Get all products
        <br><a href="/api/products" target="_blank">Test</a>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <strong>/api/orders</strong> - Get all orders
        <br><a href="/api/orders" target="_blank">Test</a>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <strong>/api/orders</strong> - Create new order
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <strong>/api/coupons</strong> - Get all coupons
        <br><a href="/api/coupons" target="_blank">Test</a>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <strong>/api/coupons/validate</strong> - Validate coupon
      </div>
      
      <div class="endpoint">
        <span class="method patch">PATCH</span> <strong>/api/orders/:orderId/status</strong> - Update order status
      </div>
    </body>
    </html>
  `);
});

// ================= Products =================
app.get('/api/products', (req, res) => {
  console.log('📦 GET /api/products called');
  try {
    const products = db.prepare('SELECT * FROM products').all();
    console.log(`✅ Found ${products.length} products`);
    
    // تحويل ingredients من JSON string إلى array
    const processedProducts = products.map(product => ({
      ...product,
      ingredients: product.ingredients ? JSON.parse(product.ingredients) : []
    }));
    
    res.json({ success: true, data: processedProducts });
  } catch (err) {
    console.error('❌ Error in /api/products:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= Coupons =================

// GET all coupons
app.get('/api/coupons', (req, res) => {
  console.log('🎫 GET /api/coupons called');
  try {
    const coupons = db
      .prepare('SELECT * FROM coupons WHERE active = 1')
      .all();
    
    console.log(`✅ Found ${coupons.length} active coupons`);
    res.json({ success: true, data: coupons });
  } catch (err) {
    console.error('❌ Error in /api/coupons:', err);
    res.status(500).json({ success: false, error: 'Failed to load coupons' });
  }
});

// POST validate coupon
app.post('/api/coupons/validate', (req, res) => {
  console.log('🔍 POST /api/coupons/validate called');
  console.log('Request body:', req.body);
  
  try {
    const { code, subtotal } = req.body;
    
    if (!code) {
      console.error('❌ No coupon code provided');
      return res.status(400).json({ 
        success: false, 
        error: 'Coupon code is required' 
      });
    }
    
    const coupon = db
      .prepare('SELECT * FROM coupons WHERE code = ? AND active = 1')
      .get(code.toUpperCase());
    
    if (!coupon) {
      console.error('❌ Coupon not found or inactive:', code);
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid coupon code' 
      });
    }
    
    if (subtotal < coupon.min_order) {
      console.error(`❌ Minimum order not met: ${subtotal} < ${coupon.min_order}`);
      return res.status(400).json({
        success: false,
        error: `Minimum order of $${coupon.min_order} required`,
        minOrder: coupon.min_order
      });
    }
    
    console.log('✅ Coupon validated:', coupon.code);
    
    res.json({ 
      success: true, 
      data: coupon 
    });
    
  } catch (err) {
    console.error('🔥 ERROR in /coupons/validate:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to validate coupon' 
    });
  }
});

// ================= Orders =================

// GET all orders
app.get('/api/orders', (req, res) => {
  console.log('📥 GET /api/orders called');
  try {
    const orders = db
      .prepare('SELECT * FROM orders ORDER BY created_at DESC')
      .all();

    console.log(`✅ Found ${orders.length} orders`);
    
    // تحويل items من JSON string إلى array
    const processedOrders = orders.map(order => ({
      ...order,
      items: order.items ? JSON.parse(order.items) : []
    }));
    
    if (orders.length > 0) {
      console.log('📋 Sample order:', processedOrders[0]);
    }

    res.json({ success: true, data: processedOrders });
  } catch (err) {
    console.error('❌ Error in GET /api/orders:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new order
app.post('/api/orders', (req, res) => {
  console.log('🚀 Received order request');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { customer, items, subtotal, discount, coupon, total } = req.body;

    // تحقق من البيانات
    if (!customer || !items || items.length === 0) {
      console.error('❌ Validation failed: Missing customer or items');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing customer information or items' 
      });
    }

    // تحقق من البيانات المطلوبة
    if (!customer.name || !customer.phone || !customer.address || !customer.paymethod) {
      console.error('❌ Missing required fields:', {
        name: !customer.name,
        phone: !customer.phone,
        address: !customer.address,
        paymethod: !customer.paymethod
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required customer fields' 
      });
    }

    const orderId = 'ORD-' + Date.now();
    console.log('✅ Generated Order ID:', orderId);

    // تحويل items إلى JSON
    const itemsJson = JSON.stringify(items);
    console.log('📋 Items JSON:', itemsJson);

    // إعداد الاستعلام
    const sql = `
      INSERT INTO orders (
        order_id,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        payment_method,
        delivery_time,
        items,
        subtotal,
        discount,
        coupon_code,
        total,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      orderId,
      customer.name,
      customer.phone,
      customer.email || null,
      customer.address,
      customer.paymethod,
      customer.deliveryTime || 'ASAP',
      itemsJson,
      subtotal || 0,
      discount || 0,
      coupon || null,
      total || 0,
      'pending'
    ];

    console.log('📝 SQL Params:', params);

    // تنفيذ الإدخال
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);

    console.log('✅ Database insert successful!');
    console.log('📊 Result:', result);
    console.log('🆔 Last insert ID:', result.lastInsertRowid);
    console.log('📈 Changes:', result.changes);

    // التحقق من الإدخال
    const checkStmt = db.prepare('SELECT * FROM orders WHERE order_id = ?');
    const insertedOrder = checkStmt.get(orderId);
    
    if (insertedOrder) {
      console.log('✅ Verification: Order found in database');
      console.log('📄 Order details:', insertedOrder);
      
      res.json({ 
        success: true, 
        orderId: orderId,
        message: 'Order placed successfully',
        order: insertedOrder
      });
    } else {
      console.error('❌ Verification failed: Order not found');
      res.status(500).json({ 
        success: false, 
        error: 'Order saved but verification failed'
      });
    }

  } catch (err) {
    console.error('🔥 ERROR in /api/orders:', err.message);
    console.error('🔍 Error details:', err);
    console.error('📚 Error stack:', err.stack);
    
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: 'Database operation failed'
    });
  }
});

// PATCH order status
app.patch('/api/orders/:orderId/status', (req, res) => {
  console.log('🔄 PATCH /api/orders/:orderId/status called');
  console.log('Order ID:', req.params.orderId);
  console.log('New status:', req.body.status);
  
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status is required' 
      });
    }

    const result = db
      .prepare('UPDATE orders SET status = ? WHERE order_id = ?')
      .run(status, req.params.orderId);

    console.log('📊 Update result:', result);

    if (result.changes === 0) {
      console.error('❌ Order not found:', req.params.orderId);
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    console.log('✅ Status updated successfully');
    res.json({ 
      success: true, 
      message: 'Status updated',
      changes: result.changes 
    });
  } catch (err) {
    console.error('❌ Error updating status:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// ================= Admin Endpoints =================

// GET all orders with full details (for admin)
app.get('/api/admin/orders', (req, res) => {
  console.log('👑 GET /api/admin/orders called');
  try {
    const orders = db
      .prepare('SELECT * FROM orders ORDER BY created_at DESC')
      .all();

    console.log(`✅ Found ${orders.length} orders for admin`);
    
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('❌ Error in admin orders:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= Start Server =================
app.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  📍 Local: http://localhost:${PORT}
  
  📋 Available endpoints:
  👉 GET  /api/products      - Get all products
  👉 GET  /api/orders        - Get all orders
  👉 POST /api/orders        - Create new order
  👉 GET  /api/coupons       - Get all coupons
  👉 POST /api/coupons/validate - Validate coupon
  
  🛠️  Database initialized:
  ✅ Products table ready
  ✅ Orders table ready
  ✅ Coupons table ready
  `);
});

// Handle server errors
app.on('error', (err) => {
  console.error('🔥 Server error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close();
  process.exit(0);
});