const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Default locals middleware - provide safe defaults for templates so partials don't throw ReferenceError
app.use((req, res, next) => {
  // currentUser and cartCount may come from session if sessions are enabled
  res.locals.currentUser = (req.session && req.session.user) ? req.session.user : null;
  res.locals.cartCount = (req.session && req.session.cart) ? req.session.cart.length : 0;
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
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.session.user || null;
  res.locals.cartCount = req.session.cart ? req.session.cart.length : 0;
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

// Mock data for demonstration (replace with actual API calls)
const mockProducts = [
  {
    id: 1,
    name: 'PlayStation 5 Console',
    description: 'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers and 3D Audio, and an all-new generation of incredible PlayStation games.',
    short_description: 'Next-gen gaming console with ultra-high speed SSD',
    price: 1250000.00,
    original_price: 1400000.00,
    category_name: 'Consoles',
    category_slug: 'consoles',
    image_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    badge: 'new',
    is_featured: true,
    stock_quantity: 10,
    specifications: [
      { name: 'CPU', value: '8x Zen 2 Cores' },
      { name: 'GPU', value: '10.28 TFLOPs' },
      { name: 'Memory', value: '16GB GDDR6' },
      { name: 'Storage', value: '825GB SSD' },
      { name: 'Resolution', value: 'Up to 8K' },
      { name: 'Frame Rate', value: 'Up to 120fps' }
    ]
  },
  {
    id: 2,
    name: 'DualSense Wireless Controller',
    description: 'Discover a deeper, highly immersive gaming experience with the innovative DualSense wireless controller.',
    short_description: 'Wireless controller with haptic feedback',
    price: 250000.00,
    original_price: 300000.00,
    category_name: 'Accessories',
    category_slug: 'accessories',
    image_url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    badge: 'sale',
    is_featured: true,
    stock_quantity: 25
  }
];

const mockCategories = [
  { id: 1, name: 'Consoles', description: 'PS5, PS4, Xbox & Nintendo', icon: 'fas fa-gamepad', slug: 'consoles', products_count: 15 },
  { id: 2, name: 'Games', description: 'Latest titles & classics', icon: 'fas fa-compact-disc', slug: 'games', products_count: 45 },
  { id: 3, name: 'Accessories', description: 'Controllers, headsets & more', icon: 'fas fa-headphones', slug: 'accessories', products_count: 32 },
  { id: 4, name: 'Electronics', description: 'Phones, gadgets & gear', icon: 'fas fa-mobile-alt', slug: 'electronics', products_count: 28 }
];

// Routes
app.get('/', (req, res) => {
  const featuredProducts = mockProducts.filter(p => p.is_featured);
  res.render('layout', {
    title: 'GameLootMalawi - Premium Gaming & Electronics',
    content: 'pages/home',
    featuredProducts,
    categories: mockCategories,
    currentUser: req.session.user
  });
});

app.get('/shop', (req, res) => {
  const { category, search, page = 1 } = req.query;
  let filteredProducts = [...mockProducts];
  
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category_slug === category);
  }
  
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm) || 
      p.description.toLowerCase().includes(searchTerm)
    );
  }
  
  res.render('layout', {
    title: 'Shop All Products - GameLootMalawi',
    content: 'pages/shop',
    products: filteredProducts,
    categories: mockCategories,
    currentCategory: category,
    searchTerm: search
  });
});

app.get('/category/:slug', (req, res) => {
  const { slug } = req.params;
  const category = mockCategories.find(c => c.slug === slug);
  const categoryProducts = mockProducts.filter(p => p.category_slug === slug);
  
  if (!category) {
    req.flash('error', 'Category not found');
    return res.redirect('/shop');
  }
  
  res.render('layout', {
    title: `${category.name} - GameLootMalawi`,
    content: 'pages/shop',
    products: categoryProducts,
    categories: mockCategories,
    currentCategory: slug,
    category
  });
});

app.get('/product/:id', (req, res) => {
  const { id } = req.params;
  const product = mockProducts.find(p => p.id === parseInt(id));
  
  if (!product) {
    req.flash('error', 'Product not found');
    return res.redirect('/shop');
  }
  
  // Get related products from same category
  const relatedProducts = mockProducts
    .filter(p => p.category_slug === product.category_slug && p.id !== product.id)
    .slice(0, 4);
  
  res.render('layout', {
    title: `${product.name} - GameLootMalawi`,
    content: 'pages/product-detail',
    product,
    relatedProducts
  });
});

app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  res.render('layout', {
    title: 'Shopping Cart - GameLootMalawi',
    content: 'pages/cart',
    cart,
    total
  });
});

app.get('/checkout', (req, res) => {
  const cart = req.session.cart || [];
  
  if (cart.length === 0) {
    req.flash('error', 'Your cart is empty');
    return res.redirect('/cart');
  }
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  res.render('layout', {
    title: 'Checkout - GameLootMalawi',
    content: 'pages/checkout',
    cart,
    total
  });
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

app.get('/profile', (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to view your profile');
    return res.redirect('/login');
  }
  
  res.render('layout', {
    title: 'My Profile - GameLootMalawi',
    content: 'pages/profile',
    user: req.session.user
  });
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
const db = require('./config/database');
const Product = require('./models/Product');
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
const upload = multer({ storage: storage });

app.post('/admin/products', isAdmin, upload.single('image'), async (req, res) => {
  try {
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

    const product = await Product.create(productData);
    
    res.json({
      success: true,
      message: 'Product added successfully',
      product: product
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding product'
    });
  }
});

// Update product
app.put('/admin/products/:id', isAdmin, upload.single('image'), async (req, res) => {
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

    const productData = {
      name: req.body.name,
      description: req.body.description,
      short_description: req.body.short_description,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      original_price: req.body.original_price ? parseFloat(req.body.original_price) : undefined,
      stock_quantity: req.body.stock_quantity ? parseInt(req.body.stock_quantity) : undefined,
      is_featured: (req.body.is_featured === 'true' || req.body.is_featured === 'on') ? 1 : 0,
      category_id: req.body.category_id ? parseInt(req.body.category_id) : undefined,
      badge: req.body.badge || undefined,
      sku: req.body.sku || undefined,
      specifications: specifications.length ? specifications : undefined
    };

    if (req.file) {
      productData.image_url = '/uploads/products/' + req.file.filename;
    }

    const updated = await Product.update(id, productData);

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
      const products = await Product.findAll({ limit: 100 }); // Get all products for admin
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
app.post('/cart/add', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = mockProducts.find(p => p.id === parseInt(productId));
  
  if (!product) {
    return res.json({ success: false, message: 'Product not found' });
  }
  
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  const existingItem = req.session.cart.find(item => item.id === product.id);
  
  if (existingItem) {
    existingItem.quantity += parseInt(quantity);
  } else {
    req.session.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: parseInt(quantity),
      stock: product.stock_quantity
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Product added to cart',
    cartCount: req.session.cart.length
  });
});

app.post('/cart/update', (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!req.session.cart) {
    return res.json({ success: false, message: 'Cart is empty' });
  }
  
  const item = req.session.cart.find(item => item.id === parseInt(productId));
  
  if (item) {
    if (parseInt(quantity) <= 0) {
      req.session.cart = req.session.cart.filter(item => item.id !== parseInt(productId));
    } else {
      item.quantity = parseInt(quantity);
    }
  }
  
  res.json({ 
    success: true, 
    message: 'Cart updated',
    cartCount: req.session.cart.length
  });
});

app.post('/cart/remove', (req, res) => {
  const { productId } = req.body;
  
  if (!req.session.cart) {
    return res.json({ success: false, message: 'Cart is empty' });
  }
  
  req.session.cart = req.session.cart.filter(item => item.id !== parseInt(productId));
  
  res.json({ 
    success: true, 
    message: 'Product removed from cart',
    cartCount: req.session.cart.length
  });
});

// Auth routes (simplified - replace with actual API calls)
// Auth routes
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('layout', {
    title: 'Login - GameLootMalawi',
    content: 'pages/login',
    user: null
  });
});

app.post('/login', authController.loginHandler);

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

// Login route is now handled by authController.loginHandler

app.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/register');
  }
  
  try {
    // In real implementation, call your backend API
    // const response = await axios.post(`${API_BASE_URL}/auth/register`, { name, email, password });
    
    // For demo purposes
    req.session.user = {
      id: 1,
      name: name,
      email: email,
      phone: '',
      address: '',
      role: 'customer'
    };
    
    req.flash('success', 'Registration successful! Welcome to GameLootMalawi');
    res.redirect('/profile');
  } catch (error) {
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/register');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
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