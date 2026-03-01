const express = require('express');
const multer = require('multer');
const db = require('../../config/database');
const Product = require('../../models/Product');
const Order = require('../../models/order');
const PaymentSettings = require('../../models/PaymentSettings');
const { isAdmin } = require('../../middleware/auth2');
const { getCachedCategories } = require('../../utils/categoryService');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'public/uploads/products/');
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

function imageFileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error('Invalid file type. Only image files are allowed.'), false);
}

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadWithErrorHandler = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'FILE_TOO_LARGE') return res.status(400).json({ success: false, message: 'File is too large (max 2MB)' });
      return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
    }
    if (err) return res.status(400).json({ success: false, message: err.message });
    return next();
  });
};

router.post('/admin/products', isAdmin, uploadWithErrorHandler, async (req, res) => {
  try {
    let specifications = [];
    if (req.body.specifications) {
      try {
        specifications = typeof req.body.specifications === 'string'
          ? JSON.parse(req.body.specifications)
          : req.body.specifications;
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
      stock_quantity: parseInt(req.body.stock_quantity, 10) || 0,
      is_featured: req.body.is_featured === 'true' || req.body.is_featured === 'on' || req.body.is_featured === true,
      category_id: parseInt(req.body.category_id, 10) || null,
      badge: req.body.badge || null,
      sku: req.body.sku || null,
      image_url: req.file ? `/uploads/products/${req.file.filename}` : null,
      specifications,
      images: []
    };

    const product = await Product.create(productData);
    return res.json({ success: true, message: 'Product added successfully', product });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ success: false, message: `Error adding product: ${error.message}` });
  }
});

router.put('/admin/products/:id', isAdmin, uploadWithErrorHandler, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    let specifications = [];
    if (req.body.specifications) {
      try {
        specifications = typeof req.body.specifications === 'string'
          ? JSON.parse(req.body.specifications)
          : req.body.specifications;
      } catch (e) {
        console.warn('Invalid specifications JSON on update, ignoring');
      }
    }

    let resolvedCategoryId = undefined;
    if (req.body.category_id) {
      resolvedCategoryId = parseInt(req.body.category_id, 10);
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
      stock_quantity: req.body.stock_quantity ? parseInt(req.body.stock_quantity, 10) : undefined,
      is_featured: (req.body.is_featured === 'true' || req.body.is_featured === 'on') ? 1 : 0,
      category_id: resolvedCategoryId !== undefined ? resolvedCategoryId : undefined,
      badge: req.body.badge || undefined,
      sku: req.body.sku || undefined,
      specifications: specifications.length ? specifications : undefined
    };

    if (req.file) productData.image_url = `/uploads/products/${req.file.filename}`;

    const updated = await Product.update(id, productData);
    return res.json({ success: true, message: 'Product updated', product: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ success: false, message: 'Error updating product' });
  }
});

router.delete('/admin/products/:id', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await Product.delete(id);
    return res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ success: false, message: 'Error deleting product' });
  }
});

router.get('/admin/products', isAdmin, async (req, res) => {
  try {
    let productsList = [];
    let categoriesList = [];

    try {
      const products = await Product.findAll({ page: 1, limit: 100 });
      productsList = products.products || [];
    } catch (err) {
      console.error('Error loading products:', err);
    }

    try {
      categoriesList = await getCachedCategories(true);
    } catch (err) {
      console.error('Error loading categories:', err);
    }

    return res.render('layout', {
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
    return res.redirect('/');
  }
});

router.get('/admin/categories', isAdmin, async (req, res) => {
  try {
    let categoriesList = [];
    try {
      categoriesList = await getCachedCategories(false);
    } catch (err) {
      console.error('Error loading categories:', err);
      req.flash('error', 'Error loading categories');
    }

    return res.render('layout', {
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
    return res.redirect('/');
  }
});

router.get('/admin/orders', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const orders = await Order.findAll({ page: parseInt(page, 10), limit: parseInt(limit, 10) });

    return res.render('layout', {
      title: 'Order Management - Admin',
      content: 'pages/admin-orders',
      orders,
      success: req.flash('success'),
      error: req.flash('error'),
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Admin orders page error:', error);
    req.flash('error', 'Error loading orders');
    return res.redirect('/');
  }
});

router.put('/admin/orders/:id/status', isAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) return res.status(404).json({ success: false, message: 'Order not found' });

    const updated = await Order.updateStatus(orderId, status);
    return res.json({ success: true, message: 'Status updated', data: updated });
  } catch (error) {
    console.error('Error updating order status (admin):', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/admin', isAdmin, async (req, res) => {
  try {
    let productsList = [];
    let categoriesList = [];

    try {
      const products = await Product.findAll({ page: 1, limit: 100 });
      productsList = products.products || [];
    } catch (err) {
      console.error('Error loading products:', err);
    }

    try {
      categoriesList = await getCachedCategories(false);
    } catch (err) {
      console.error('Error loading categories:', err);
    }

    return res.render('layout', {
      title: 'Admin Dashboard - GameLootMalawi',
      content: 'pages/admin-dashboard',
      products: productsList,
      categories: categoriesList,
      success: req.flash('success'),
      error: req.flash('error'),
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error', 'Error loading admin dashboard');
    return res.redirect('/');
  }
});

router.get('/admin/payment-settings', isAdmin, async (req, res) => {
  try {
    const settings = await PaymentSettings.get();
    const saved = req.query.saved === '1';
    return res.render('layout', {
      title: 'Payment Settings - Admin',
      content: 'pages/admin-payment-settings',
      settings,
      saved,
      success: req.flash('success'),
      error: req.flash('error'),
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Admin payment settings page error:', error);
    req.flash('error', 'Could not load payment settings');
    return res.redirect('/admin');
  }
});

router.post('/admin/payment-settings', isAdmin, async (req, res) => {
  try {
    await PaymentSettings.update(req.body);
    req.flash('success', 'Payment settings updated');
    return res.redirect('/admin/payment-settings?saved=1');
  } catch (error) {
    console.error('Update payment settings error:', error);
    req.flash('error', 'Could not update payment settings');
    return res.redirect('/admin/payment-settings');
  }
});

module.exports = router;
