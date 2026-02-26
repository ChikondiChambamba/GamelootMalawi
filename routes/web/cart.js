const express = require('express');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const Order = require('../../models/order');
const mailer = require('../../utils/mailer');

const router = express.Router();

router.get('/cart', async (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to view your cart');
    return res.redirect('/login');
  }

  try {
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

router.get('/checkout', async (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to checkout');
    return res.redirect('/login');
  }

  try {
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

router.post('/cart/add', async (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: 'Please login to add items to cart', requireLogin: true });
  }

  const { productId, quantity = 1 } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.json({ success: false, message: 'Product not found' });
    }

    if (product.stock_quantity < quantity) {
      return res.json({ success: false, message: 'Insufficient stock available' });
    }

    await Cart.addItem(req.session.user.id, productId, parseInt(quantity, 10));
    const cartCount = await Cart.getCartCount(req.session.user.id);

    return res.json({ success: true, message: 'Product added to cart', cartCount });
  } catch (err) {
    console.error('Cart add error:', err);
    return res.json({ success: false, message: 'Error adding to cart' });
  }
});

router.post('/cart/update', async (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: 'Please login to update cart' });
  }

  const { productId, quantity } = req.body;

  try {
    await Cart.updateQuantity(req.session.user.id, parseInt(productId, 10), parseInt(quantity, 10));
    const cartCount = await Cart.getCartCount(req.session.user.id);

    return res.json({
      success: true,
      message: 'Cart updated',
      cartCount
    });
  } catch (err) {
    console.error('Cart update error:', err);
    return res.json({ success: false, message: 'Error updating cart' });
  }
});

router.post('/cart/remove', async (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: 'Please login to manage cart' });
  }

  const { productId } = req.body;

  try {
    await Cart.removeItem(req.session.user.id, parseInt(productId, 10));
    const cartCount = await Cart.getCartCount(req.session.user.id);

    return res.json({
      success: true,
      message: 'Product removed from cart',
      cartCount
    });
  } catch (err) {
    console.error('Cart remove error:', err);
    return res.json({ success: false, message: 'Error removing from cart' });
  }
});

router.post('/orders', async (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to place an order');
    return res.redirect('/login');
  }

  const { fullName, phone, address, city, postalCode, paymentMethod } = req.body;
  try {
    const cartItems = await Cart.getCartItems(req.session.user.id);
    if (!cartItems || cartItems.length === 0) {
      req.flash('error', 'Your cart is empty');
      return res.redirect('/cart');
    }

    const items = cartItems.map((item) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.price) || 0,
      total_price: (Number(item.quantity) || 1) * (Number(item.price) || 0)
    }));
    const total_amount = items.reduce((sum, item) => sum + item.total_price, 0);

    const orderData = {
      user_id: req.session.user.id,
      total_amount,
      shipping_address: `${address || ''}, ${city || ''}${postalCode ? ` (${postalCode})` : ''}`.trim(),
      billing_address: `${address || ''}, ${city || ''}${postalCode ? ` (${postalCode})` : ''}`.trim(),
      customer_name: fullName || req.session.user.name || 'Customer',
      customer_email: req.session.user.email,
      customer_phone: phone || req.session.user.phone || '',
      payment_method: paymentMethod || 'cash_on_delivery'
    };

    const order = await Order.create(orderData, items);
    await Cart.clearCart(req.session.user.id);

    const listItems = items
      .map((i, idx) => `<li>${idx + 1}. Qty ${i.quantity} - MWK ${Number(i.total_price).toLocaleString()}</li>`)
      .join('');
    const html = `
      <h2>Order Confirmation</h2>
      <p>Hi ${orderData.customer_name}, your order has been placed successfully.</p>
      <p><strong>Order #:</strong> ${order.order_number || order.id}</p>
      <p><strong>Total:</strong> MWK ${Number(total_amount).toLocaleString()}</p>
      <p><strong>Payment Method:</strong> ${orderData.payment_method}</p>
      <p><strong>Shipping Address:</strong> ${orderData.shipping_address}</p>
      <h4>Order Items</h4>
      <ul>${listItems}</ul>
      <p>You can track this order under <strong>My Orders</strong>.</p>
    `;

    try {
      await mailer.sendMail(req.session.user.email, `GameLootMalawi Order Confirmation - ${order.order_number || order.id}`, html);
    } catch (mailErr) {
      console.error('Order email send failed:', mailErr);
    }

    req.flash('success', `Order placed successfully. Confirmation sent to ${req.session.user.email}.`);
    return res.redirect('/orders');
  } catch (err) {
    console.error('Place order error:', err);
    req.flash('error', 'Could not place order. Please try again.');
    return res.redirect('/checkout');
  }
});

module.exports = router;
