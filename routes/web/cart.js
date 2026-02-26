const express = require('express');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');

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

module.exports = router;

