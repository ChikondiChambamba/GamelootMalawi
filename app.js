const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Ensure upload directories exist
const uploadDirs = [
    path.join(__dirname, 'public/uploads/products'),
    path.join(__dirname, 'public/uploads/categories')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'public/uploads/';
        
        if (req.baseUrl.includes('products')) {
            uploadPath += 'products/';
        } else if (req.baseUrl.includes('categories')) {
            uploadPath += 'categories/';
        } else {
            uploadPath += 'general/';
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

const fileFilter = (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
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

// =============================================
// PRODUCT MANAGEMENT ROUTES (No admin required)
// =============================================

// Add Product Form
app.get('/add-product', (req, res) => {
    res.render('layout', {
        title: 'Add Product - GameLootMalawi',
        content: 'pages/add-product',
        categories: mockCategories,
        currentSection: 'add-product'
    });
});

// Handle Product Creation with Image Upload
app.post('/add-product', upload.single('productImage'), (req, res) => {
    try {
        const { name, description, shortDescription, price, originalPrice, category, sku, badge, stockQuantity, isFeatured } = req.body;
        
        // Validate required fields
        if (!name || !price || !category) {
            req.flash('error', 'Name, price, and category are required fields.');
            return res.redirect('/add-product');
        }

        // Handle file upload
        let imageUrl = '';
        if (req.file) {
            imageUrl = '/uploads/products/' + req.file.filename;
        } else {
            // Use a default image if no file uploaded
            imageUrl = '/images/default-product.jpg';
        }

        // Create new product
        const newProduct = {
            id: mockProducts.length + 1,
            name,
            description,
            short_description: shortDescription,
            price: parseFloat(price),
            original_price: originalPrice ? parseFloat(originalPrice) : null,
            category_id: parseInt(category),
            category_name: mockCategories.find(c => c.id === parseInt(category))?.name || 'Uncategorized',
            category_slug: mockCategories.find(c => c.id === parseInt(category))?.slug || 'uncategorized',
            image_url: imageUrl,
            sku,
            badge: badge || 'none',
            stock_quantity: parseInt(stockQuantity) || 0,
            is_featured: isFeatured === 'on',
            is_active: true,
            created_at: new Date()
        };

        // Add to mock data
        mockProducts.push(newProduct);

        req.flash('success', 'Product added successfully!');
        res.redirect('/shop');
    } catch (error) {
        console.error('Error adding product:', error);
        req.flash('error', 'Error adding product. Please try again.');
        res.redirect('/add-product');
    }
});

// Edit Product Form
app.get('/edit-product/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = mockProducts.find(p => p.id === productId);
    
    if (!product) {
        req.flash('error', 'Product not found.');
        return res.redirect('/shop');
    }

    res.render('layout', {
        title: 'Edit Product - GameLootMalawi',
        content: 'pages/edit-product',
        product,
        categories: mockCategories,
        currentSection: 'edit-product'
    });
});

// Handle Product Update with Image Upload
app.post('/edit-product/:id', upload.single('productImage'), (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const productIndex = mockProducts.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            req.flash('error', 'Product not found.');
            return res.redirect('/shop');
        }

        const { name, description, shortDescription, price, originalPrice, category, sku, badge, stockQuantity, isFeatured } = req.body;

        // Update product data
        mockProducts[productIndex] = {
            ...mockProducts[productIndex],
            name,
            description,
            short_description: shortDescription,
            price: parseFloat(price),
            original_price: originalPrice ? parseFloat(originalPrice) : null,
            category_id: parseInt(category),
            category_name: mockCategories.find(c => c.id === parseInt(category))?.name || 'Uncategorized',
            category_slug: mockCategories.find(c => c.id === parseInt(category))?.slug || 'uncategorized',
            sku,
            badge: badge || 'none',
            stock_quantity: parseInt(stockQuantity) || 0,
            is_featured: isFeatured === 'on',
            updated_at: new Date()
        };

        // Handle new image upload
        if (req.file) {
            mockProducts[productIndex].image_url = '/uploads/products/' + req.file.filename;
        }

        req.flash('success', 'Product updated successfully!');
        res.redirect('/product/' + productId);
    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('error', 'Error updating product. Please try again.');
        res.redirect(`/edit-product/${req.params.id}`);
    }
});

// Delete Product
app.post('/delete-product/:id', (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const productIndex = mockProducts.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            req.flash('error', 'Product not found.');
            return res.redirect('/shop');
        }

        // Remove product from array
        mockProducts.splice(productIndex, 1);

        req.flash('success', 'Product deleted successfully!');
        res.redirect('/shop');
    } catch (error) {
        console.error('Error deleting product:', error);
        req.flash('error', 'Error deleting product. Please try again.');
        res.redirect('/shop');
    }
});

// Add Category Form
app.get('/add-category', (req, res) => {
    res.render('layout', {
        title: 'Add Category - GameLootMalawi',
        content: 'pages/add-category',
        currentSection: 'add-category'
    });
});

// Handle Category Creation with Image Upload
app.post('/add-category', upload.single('categoryImage'), (req, res) => {
    try {
        const { name, description, slug, icon } = req.body;
        
        if (!name || !slug) {
            req.flash('error', 'Name and slug are required fields.');
            return res.redirect('/add-category');
        }

        // Handle file upload for category image
        let imageUrl = '';
        if (req.file) {
            imageUrl = '/uploads/categories/' + req.file.filename;
        }

        // Create new category
        const newCategory = {
            id: mockCategories.length + 1,
            name,
            description,
            slug,
            icon: icon || 'fas fa-folder',
            image_url: imageUrl,
            is_active: true,
            created_at: new Date()
        };

        mockCategories.push(newCategory);

        req.flash('success', 'Category added successfully!');
        res.redirect('/shop');
    } catch (error) {
        console.error('Error adding category:', error);
        req.flash('error', 'Error adding category. Please try again.');
        res.redirect('/add-category');
    }
});

// =============================================
// EXISTING ROUTES (with currentSection added)
// =============================================

app.get('/', (req, res) => {
  const featuredProducts = mockProducts.filter(p => p.is_featured);
  res.render('layout', {
    title: 'GameLootMalawi - Premium Gaming & Electronics',
    content: 'pages/home',
    featuredProducts,
    categories: mockCategories,
    currentSection: 'home'
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
    searchTerm: search,
    currentSection: 'shop'
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
    category,
    currentSection: slug
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
    relatedProducts,
    currentSection: product.category_slug
  });
});

app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  res.render('layout', {
    title: 'Shopping Cart - GameLootMalawi',
    content: 'pages/cart',
    cart,
    total,
    currentSection: 'cart'
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
    total,
    currentSection: 'checkout'
  });
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  
  res.render('layout', {
    title: 'Login - GameLootMalawi',
    content: 'pages/login',
    currentSection: 'login'
  });
});

app.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  
  res.render('layout', {
    title: 'Register - GameLootMalawi',
    content: 'pages/register',
    currentSection: 'register'
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
    user: req.session.user,
    currentSection: 'profile'
  });
});

app.get('/orders', (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to view your orders');
    return res.redirect('/login');
  }
  
  res.render('layout', {
    title: 'My Orders - GameLootMalawi',
    content: 'pages/orders',
    currentSection: 'orders'
  });
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
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Simulate API call
  try {
    // For demo purposes, create a mock user
    if (email && password) {
      req.session.user = {
        id: 1,
        name: 'Demo User',
        email: email,
        phone: '+265 123 456 789',
        address: 'Lilongwe, Malawi',
        role: 'customer'
      };
      
      req.flash('success', 'Login successful!');
      res.redirect('/profile');
    } else {
      req.flash('error', 'Invalid email or password');
      res.redirect('/login');
    }
  } catch (error) {
    req.flash('error', 'Login failed. Please try again.');
    res.redirect('/login');
  }
});

app.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/register');
  }
  
  try {
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

// Error handling middleware for file uploads
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      req.flash('error', 'File too large. Maximum size is 5MB.');
    } else {
      req.flash('error', 'File upload error: ' + error.message);
    }
  } else if (error) {
    req.flash('error', error.message);
  }
  
  // Redirect back to the previous page
  const referer = req.get('Referer') || '/';
  res.redirect(referer);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
  console.log(`Add products: http://localhost:${PORT}/add-product`);
  console.log(`Add categories: http://localhost:${PORT}/add-category`);
});