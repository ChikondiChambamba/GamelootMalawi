const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { auth, adminAuth } = require('../middleware/auth');

// Validation rules
const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  body('slug').notEmpty().withMessage('Category slug is required')
];

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Admin routes
router.post('/', adminAuth, categoryValidation, categoryController.createCategory);
router.put('/:id', adminAuth, categoryController.updateCategory);
router.delete('/:id', adminAuth, categoryController.deleteCategory);

module.exports = router;