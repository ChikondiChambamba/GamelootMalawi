const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Validation rules
const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Product description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('category_id').isInt({ min: 1 }).withMessage('Valid category is required'),
  body('sku').notEmpty().withMessage('SKU is required')
];

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:id', productController.getProductById);

// Admin routes
router.post('/', adminAuth, upload.single('image'), productValidation, productController.createProduct);
router.put('/:id', adminAuth, upload.single('image'), productController.updateProduct);
router.delete('/:id', adminAuth, productController.deleteProduct);

module.exports = router;

// Pagination guards
page = parseInt(page, 10) || 1;
limit = parseInt(limit, 10) || 10;
const offset = Math.max(0, (page - 1) * limit);