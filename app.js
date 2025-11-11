const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Database and models available early so routes can use them
const db = require('./config/database');
const Product = require('./models/Product');

// Middleware
// Security headers - with CSP allowing Bootstrap, jQuery, and Unsplash images
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://code.jquery.com"],
            scriptSrcElem: ["'self'", "https://cdn.jsdelivr.net", "https://code.jquery.com"],
            scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers like onclick
            styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        }
    }
}));

// Rate limiters (applied to auth endpoints further below)
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, message: 'Too many login attempts, please try again later.' });
const createAccountLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many accounts created from this IP, please try again after an hour.' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Default locals middleware - provide safe defaults for templates so partials don't throw ReferenceError
app.use((req, res, next) => {
  // currentUser and cartCount may come from session if sessions are enabled
  res.locals.currentUser = (req.session && req.session.user) ? req.session.user : null;
  res.locals.cartCount = 0; // Will be updated in the async middleware below
  // search term can come from querystring
  res.locals.searchTerm = (req.query && req.query.search) ? req.query.search : '';
  // currentSection can be set per-route; default to empty string
  res.locals.currentSection = res.locals.currentSection || '';
  // category and products defaults to avoid template ReferenceErrors
  res.locals.category = res.locals.category || null;
  res.locals.products = res.locals.products || [];
  // flash messages - guard if connect-flash isn't enabled
  if (req.flash && typeof req.flash === 'function') {
    res.locals.success = req.flash('success') || [];
    res.locals.error = req.flash('error') || [];
  } else {
    res.locals.success = res.locals.success || [];
    res.locals.error = res.locals.error || [];
  }
  next();
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'gamelootmalawi-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: (process.env.NODE_ENV === 'production'), sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(flash());

// Global variables
app.use(async (req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.session.user || null;
  
  // Set cart count based on whether user is logged in
  if (req.session.user) {
    try {
      const Cart = require('./models/Cart');
      res.locals.cartCount = await Cart.getCartCount(req.session.user.id);
    } catch (err) {
      console.error('Error getting cart count:', err);
      res.locals.cartCount = 0;
    }
  } else {
    res.locals.cartCount = 0;
  }
  
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'views/pages'),
  path.join(__dirname, 'views/partials')
]);

// API base URL
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';



// Routes
app.get('/', async (req, res) => {
  try {
    // Load featured products (use dedicated helper which returns an array)
    let featuredProducts = [];
    try {
      featuredProducts = await Product.findFeatured(6);
      if (!Array.isArray(featuredProducts)) featuredProducts = [];
    } catch (err) {
      console.warn('Could not load featured products from DB', err);
      featuredProducts = [];
    }

    // Load all products (lightweight simple listing)
    let allProducts = [];
    try {
      allProducts = await Product.findAllSimple(12, 0);
      if (!Array.isArray(allProducts)) allProducts = [];
    } catch (err) {
      console.warn('Could not load all products from DB', err);
      allProducts = [];
    }

    // Load categories from DB when available
    let categories = [];
    try {
      const [rows] = await db.execute('SELECT * FROM categories WHERE is_active = TRUE ORDER BY name ASC');
      if (Array.isArray(rows) && rows.length) categories = rows;
    } catch (err) {
      console.warn('Could not load categories from DB', err);
    }

    res.render('layout', {
      title: 'GameLootMalawi - Premium Gaming & Electronics',
      content: 'pages/home',
      featuredProducts,
      allProducts,
      categories,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Home route error:', error);
    // Fallback rendering
    res.render('layout', {
      title: 'GameLootMalawi - Premium Gaming & Electronics',
      content: 'pages/home',
      featuredProducts: [],
      categories: [],
      currentUser: req.session.user
    });
  }
});

app.get('/shop', async (req, res) => {
  const { category, search, page = 1 } = req.query;
  const limit = 20;

  try {
    const result = await Product.findAll({ page: parseInt(page, 10) || 1, limit, category, search });
    const products = result.products || [];

    // Load categories
    let categories = [];
    try {
      const [rows] = await db.execute('SELECT * FROM categories WHERE is_active = TRUE ORDER BY name ASC');
      categories = rows || [];
    } catch (err) {
      console.error('Could not load categories for shop:', err);
    }

    res.render('layout', {
      title: 'Shop All Products - GameLootMalawi',
      content: 'pages/shop',
      products: products,
      categories: categories,
      currentCategory: category,
      searchTerm: search,
      pagination: result.pagination || {}
    });
  } catch (err) {
    console.error('Shop route error:', err);
    req.flash('error', 'Could not load products');
    res.redirect('/');
  }
});

app.get('/category/:slug', async (req, res) => {
  const { slug } = req.params;
  const page = req.query.page || 1;
  const limit = 20;

  try {
    const [catRows] = await db.execute('SELECT * FROM categories WHERE slug = ? LIMIT 1', [slug]);
    if (!catRows || catRows.length === 0) {
      req.flash('error', 'Category not found');
      return res.redirect('/shop');
    }
    const category = catRows[0];

    const products = await Product.findByCategory(slug, { page: parseInt(page, 10) || 1, limit });

    // Load categories list
    let categories = [];
    try {
      const [rows] = await db.execute('SELECT * FROM categories WHERE is_active = TRUE ORDER BY name ASC');
      categories = rows || [];
    } catch (err) {
      console.error('Could not load categories for category page:', err);
    }

    res.render('layout', {
      title: `${category.name} - GameLootMalawi`,
      content: 'pages/shop',
      products: products,
      categories: categories,
      currentCategory: slug,
      category
    });
  } catch (err) {
    console.error('Category page error:', err);
    req.flash('error', 'Could not load category');
    res.redirect('/shop');
  }
});

app.get('/product/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/shop');
    }

    // Get related products from same category
    let relatedProducts = [];
    try {
      relatedProducts = await Product.findByCategory(product.category_slug, { page: 1, limit: 4 });
      relatedProducts = (Array.isArray(relatedProducts) ? relatedProducts : relatedProducts.products || []).filter(p => p.id !== product.id).slice(0,4);
    } catch (err) {
      console.error('Could not load related products:', err);
    }

    res.render('layout', {
      title: `${product.name} - GameLootMalawi`,
      content: 'pages/product-detail',
      product,
      relatedProducts
    });
  } catch (err) {
    console.error('Product page error:', err);
    req.flash('error', 'Error loading product');
    res.redirect('/shop');
  }
});

app.get('/cart', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    req.flash('error', 'Please login to view your cart');
    return res.redirect('/login');
  }

  try {
    const Cart = require('./models/Cart');
    
    // Get user's cart items from database
    const cartItems = await Cart.getCartItems(req.session.user.id);
    const total = await Cart.getCartTotal(req.session.user.id);
    
    res.render('layout', {
      title: 'Shopping Cart - GameLootMalawi',
      content: 'pages/cart',
      cart: cartItems || [],
      total: total || 0
    });
  } catch (err) {
    console.error('Cart page error:', err);
    req.flash('error', 'Error loading cart');
    res.redirect('/');
  }
});

app.get('/checkout', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    req.flash('error', 'Please login to checkout');
    return res.redirect('/login');
  }

  try {
    const Cart = require('./models/Cart');
    
    // Get user's cart items from database
    const cartItems = await Cart.getCartItems(req.session.user.id);
    
    if (cartItems.length === 0) {
      req.flash('error', 'Your cart is empty');
      return res.redirect('/cart');
    }
    
    const total = await Cart.getCartTotal(req.session.user.id);
    
    res.render('layout', {
      title: 'Checkout - GameLootMalawi',
      content: 'pages/checkout',
      cart: cartItems || [],
      total: total || 0
    });
  } catch (err) {
    console.error('Checkout page error:', err);
    req.flash('error', 'Error loading checkout');
    res.redirect('/cart');
  }
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  
  res.render('layout', {
    title: 'Login - GameLootMalawi',
    content: 'pages/login'
  });
});

app.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  
  res.render('layout', {
    title: 'Register - GameLootMalawi',
    content: 'pages/register'
  });
});

app.get('/profile', async (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to view your profile');
    return res.redirect('/login');
  }

  try {
    const Cart = require('./models/Cart');
    const cartItems = await Cart.getCartItems(req.session.user.id) || [];
    const total = await Cart.getCartTotal(req.session.user.id) || 0;

    res.render('layout', {
      title: 'My Profile - GameLootMalawi',
      content: 'pages/profile',
      user: req.session.user,
      cart: cartItems,
      cartTotal: total
    });
  } catch (err) {
    console.error('Error loading profile cart:', err);
    req.flash('error', 'Error loading profile');
    res.redirect('/');
  }
});

app.get('/orders', (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to view your orders');
    return res.redirect('/login');
  }
  
  res.render('layout', {
    title: 'My Orders - GameLootMalawi',
    content: 'pages/orders'
  });
});

// Import middleware and controllers
const { isAuth, isAdmin } = require('./middleware/auth2');
const authController = require('./controllers/authControllers');
const Order = require('./models/order');

// Admin routes
// Handle file uploads for products
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/products/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
// Restrict uploads to images and limit size (2 MB)
function imageFileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.'), false);
  }
}

const upload = multer({ storage: storage, fileFilter: imageFileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

// Wrapper to handle multer file upload errors
const uploadWithErrorHandler = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'FILE_TOO_LARGE') {
        return res.status(400).json({ success: false, message: 'File is too large (max 2MB)' });
      }
      return res.status(400).json({ success: false, message: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

app.post('/admin/products', isAdmin, uploadWithErrorHandler, async (req, res) => {
  try {
    console.log('POST /admin/products - incoming request body:', Object.keys(req.body));
    console.log('POST /admin/products - file:', req.file ? req.file.filename : 'no file');
    
    // Parse specifications if provided as JSON string
    let specifications = [];
    if (req.body.specifications) {
      try {
        specifications = typeof req.body.specifications === 'string' ? JSON.parse(req.body.specifications) : req.body.specifications;
      } catch (e) {
        console.warn('Invalid specifications JSON, ignoring');
      }
    }

    const productData = {
      name: req.body.name,
      description: req.body.description,
      short_description: req.body.short_description,
      price: parseFloat(req.body.price) || 0,
      original_price: req.body.original_price ? parseFloat(req.body.original_price) : null,
      stock_quantity: parseInt(req.body.stock_quantity) || 0,
      is_featured: req.body.is_featured === 'true' || req.body.is_featured === 'on' || req.body.is_featured === true,
      category_id: parseInt(req.body.category_id) || null,
      badge: req.body.badge || null,
      sku: req.body.sku || null,
      image_url: req.file ? '/uploads/products/' + req.file.filename : null,
      specifications: specifications,
      images: []
    };

    console.log('Creating product:', productData);
    const product = await Product.create(productData);
    
    console.log('Product created successfully:', product.id);
    res.json({
      success: true,
      message: 'Product added successfully',
      product: product
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding product: ' + error.message
    });
  }
});

// Update product
app.put('/admin/products/:id', isAdmin, uploadWithErrorHandler, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Parse specifications
    let specifications = [];
    if (req.body.specifications) {
      try {
        specifications = typeof req.body.specifications === 'string' ? JSON.parse(req.body.specifications) : req.body.specifications;
      } catch (e) {
        console.warn('Invalid specifications JSON on update, ignoring');
      }
    }

    // Resolve category: some admin forms submit `category_name` instead of `category_id`.
    let resolvedCategoryId = undefined;
    if (req.body.category_id) {
      resolvedCategoryId = parseInt(req.body.category_id);
    } else if (req.body.category_name) {
      try {
        const [catRows] = await db.execute('SELECT id FROM categories WHERE name = ? LIMIT 1', [req.body.category_name]);
        if (Array.isArray(catRows) && catRows.length) resolvedCategoryId = catRows[0].id;
      } catch (e) {
        console.warn('Could not resolve category_name to id on product update', req.body.category_name, e);
      }
    }

    const productData = {
      name: req.body.name,
      description: req.body.description,
      short_description: req.body.short_description,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      original_price: req.body.original_price ? parseFloat(req.body.original_price) : undefined,
      stock_quantity: req.body.stock_quantity ? parseInt(req.body.stock_quantity) : undefined,
      is_featured: (req.body.is_featured === 'true' || req.body.is_featured === 'on') ? 1 : 0,
      category_id: resolvedCategoryId !== undefined ? resolvedCategoryId : undefined,
      badge: req.body.badge || undefined,
      sku: req.body.sku || undefined,
      specifications: specifications.length ? specifications : undefined
    };

    if (req.file) {
      productData.image_url = '/uploads/products/' + req.file.filename;
    }

    console.log('Admin update product payload for id=' + id + ':', productData);
    const updated = await Product.update(id, productData);
    console.log('Product.update returned:', updated);

    res.json({ success: true, message: 'Product updated', product: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Error updating product' });
  }
});

// Delete product (soft delete)
app.delete('/admin/products/:id', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await Product.delete(id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
});

app.get('/admin/products', isAdmin, async (req, res) => {
  try {
    console.log('Loading admin products page...');
    
    // Get products with proper error handling
    let productsList = [];
    try {
      const products = await Product.findAll({ page: 1, limit: 100 });
      productsList = products.products || [];
      console.log(`Found ${productsList.length} products`);
    } catch (err) {
      console.error('Error loading products:', err);
      // Continue with empty products list
    }

    // Get categories with proper error handling
    let categoriesList = [];
    try {
      const [categories] = await db.execute('SELECT * FROM categories WHERE is_active = TRUE');
      categoriesList = categories || [];
      console.log(`Found ${categoriesList.length} categories`);
    } catch (err) {
      console.error('Error loading categories:', err);
      // Continue with empty categories list
    }
    
    res.render('layout', {
      title: 'Product Management - Admin',
      content: 'pages/admin-products',
      products: productsList,
      categories: categoriesList,
      success: req.flash('success'),
      error: req.flash('error'),
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Admin products page error:', error);
    req.flash('error', 'Error loading admin page');
    res.redirect('/');
  }
});

// Admin Categories Route
app.get('/admin/categories', isAdmin, async (req, res) => {
  try {
    console.log('Loading admin categories page...');
    
    // Get categories with proper error handling
    let categoriesList = [];
    try {
      const [categories] = await db.execute('SELECT * FROM categories ORDER BY name ASC');
      categoriesList = categories || [];
      console.log(`Found ${categoriesList.length} categories for management`);
    } catch (err) {
      console.error('Error loading categories:', err);
      req.flash('error', 'Error loading categories');
    }
    
    res.render('layout', {
      title: 'Category Management - Admin',
      content: 'pages/admin-categories',
      categories: categoriesList,
      success: req.flash('success'),
      error: req.flash('error'),
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Admin categories page error:', error);
    req.flash('error', 'Error loading categories page');
    res.redirect('/');
  }
});

// API Routes for cart operations
app.post('/cart/add', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.json({ success: false, message: 'Please login to add items to cart', requireLogin: true });
  }

  const { productId, quantity = 1 } = req.body;
  try {
    const Cart = require('./models/Cart');
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.json({ success: false, message: 'Product not found' });
    }

    // Check stock availability
    if (product.stock_quantity < quantity) {
      return res.json({ success: false, message: 'Insufficient stock available' });
    }

    // Add to database cart
    await Cart.addItem(req.session.user.id, productId, parseInt(quantity));

    // Get updated cart count
    const cartCount = await Cart.getCartCount(req.session.user.id);

    res.json({ success: true, message: 'Product added to cart', cartCount });
  } catch (err) {
    console.error('Cart add error:', err);
    res.json({ success: false, message: 'Error adding to cart' });
  }
});

app.post('/cart/update', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.json({ success: false, message: 'Please login to update cart' });
  }

  const { productId, quantity } = req.body;

  try {
    const Cart = require('./models/Cart');

    await Cart.updateQuantity(req.session.user.id, parseInt(productId), parseInt(quantity));

    const cartCount = await Cart.getCartCount(req.session.user.id);

    res.json({
      success: true,
      message: 'Cart updated',
      cartCount
    });
  } catch (err) {
    console.error('Cart update error:', err);
    res.json({ success: false, message: 'Error updating cart' });
  }
});

app.post('/cart/remove', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.json({ success: false, message: 'Please login to manage cart' });
  }

  const { productId } = req.body;

  try {
    const Cart = require('./models/Cart');

    await Cart.removeItem(req.session.user.id, parseInt(productId));

    const cartCount = await Cart.getCartCount(req.session.user.id);

    res.json({
      success: true,
      message: 'Product removed from cart',
      cartCount
    });
  } catch (err) {
    console.error('Cart remove error:', err);
    res.json({ success: false, message: 'Error removing from cart' });
  }
});

// Auth routes (simplified - replace with actual API calls)
// Login page route: the main login GET is defined above; here we expose the auth POST handlers.
app.post('/login', loginLimiter, authController.loginHandler);

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

// Login route is now handled by authController.loginHandler

app.post('/register', createAccountLimiter, async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/register');
  }
  
  try {
    // Import User model
    const User = require('./models/User');
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      req.flash('error', 'Email already registered. Please login or use a different email.');
      return res.redirect('/register');
    }
    
    // Create new user in database
    const newUser = await User.create({
      name: name,
      email: email,
      password: password,
      phone: '',
      address: '',
      role: 'customer'
    });
    
    // Set session with new user data
    req.session.user = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || '',
      address: newUser.address || '',
      role: newUser.role
    };
    
    req.flash('success', 'Registration successful! Welcome to GameLootMalawi');
    res.redirect('/profile');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/register');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});

// Admin Orders Page
app.get('/admin/orders', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const orders = await Order.findAll({ page: parseInt(page), limit: parseInt(limit) });

    res.render('layout', {
      title: 'Order Management - Admin',
      content: 'pages/admin-orders',
      orders: orders,
      success: req.flash('success'),
      error: req.flash('error'),
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Admin orders page error:', error);
    req.flash('error', 'Error loading orders');
    res.redirect('/');
  }
});

// Admin update order status (session-based)
app.put('/admin/orders/:id/status', isAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    // Basic validation
    const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updated = await Order.updateStatus(orderId, status);
    res.json({ success: true, message: 'Status updated', data: updated });
  } catch (error) {
    console.error('Error updating order status (admin):', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Global error handler (simple, logs error and redirects user)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  // For API/XHR requests respond with JSON
  if (req.xhr || (req.headers && req.headers.accept && req.headers.accept.indexOf('json') !== -1)) {
    return res.status(err.status || 500).json({ success: false, message: 'Server error' });
  }
  // Otherwise set a flash message if available and redirect home
  try { if (req.flash && typeof req.flash === 'function') req.flash('error', 'Internal Server Error'); } catch (e) {}
  res.status(err.status || 500).redirect('/');
});