const Order = require('../models/order');
const { OrderService } = require('../services/OrderService');
const { sendOrderStatusUpdateEmail } = require('../utils/orderStatusEmail');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { items, shipping_address, billing_address, payment_method } = req.body;
    const order = await OrderService.createOrder({
      user: req.user,
      items,
      shippingAddress: shipping_address,
      billingAddress: billing_address,
      paymentMethod: payment_method
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      message: error.status ? error.message : 'Server error while creating order'
    });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const orders = await Order.findByUserId(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching orders' 
    });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching order' 
    });
  }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const orders = await Order.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching orders' 
    });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = await Order.updateStatus(orderId, status);
    try {
      await sendOrderStatusUpdateEmail(order, existingOrder.status, status);
    } catch (mailErr) {
      console.error('Order status email send failed (api route):', mailErr && mailErr.message ? mailErr.message : mailErr);
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating order status' 
    });
  }
};
