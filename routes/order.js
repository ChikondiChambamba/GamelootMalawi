const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { auth, adminAuth } = require('../middleware/auth');

// Validation rules
const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shipping_address').notEmpty().withMessage('Shipping address is required'),
  body('payment_method').isIn(['credit_card', 'apple_pay', 'shop_pay', 'cash_on_delivery']).withMessage('Valid payment method is required')
];

const statusValidation = [
  body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).withMessage('Valid status is required')
];

// User routes
router.post('/', auth, orderValidation, orderController.createOrder);
router.get('/my-orders', auth, orderController.getUserOrders);
router.get('/:id', auth, orderController.getOrderById);

// Admin routes
router.get('/', adminAuth, orderController.getAllOrders);
router.put('/:id/status', adminAuth, statusValidation, orderController.updateOrderStatus);

module.exports = router;