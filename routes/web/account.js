const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const authController = require('../../controllers/authControllers');
const User = require('../../models/User');
const Cart = require('../../models/Cart');
const Order = require('../../models/order');
const Wishlist = require('../../models/Wishlist');
const db = require('../../config/database');
const mailer = require('../../utils/mailer');

module.exports = function createAccountRouter({
  loginLimiter,
  createAccountLimiter,
  forgotPasswordLimiter
}) {
  const router = express.Router();

  router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/profile');
    return res.render('layout', { title: 'Login - GameLootMalawi', content: 'pages/login' });
  });

  router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/profile');
    return res.render('layout', { title: 'Register - GameLootMalawi', content: 'pages/register' });
  });

  router.get('/forgot-password', (req, res) => {
    if (req.session.user) return res.redirect('/profile');
    return res.render('layout', { title: 'Forgot Password - GameLootMalawi', content: 'pages/forgot-password' });
  });

  router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        req.flash('success', 'If an account with that email exists, a reset link has been sent.');
        return res.redirect('/login');
      }

      await db.execute(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          token_hash VARCHAR(255) NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user (user_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.execute('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
      await db.execute('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?,?,?)', [user.id, tokenHash, expiresAt]);

      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      let html = `Hello ${user.name || ''},\n\nPlease visit: ${resetLink}`;
      try {
        const tmplPath = path.join(process.cwd(), 'utils', 'emailTemplates', 'resetPassword.html');
        if (fs.existsSync(tmplPath)) {
          html = fs.readFileSync(tmplPath, 'utf8');
          html = html.replace(/{{resetLink}}/g, resetLink).replace(/{{name}}/g, user.name || '');
        }
      } catch (tmplErr) {
        console.warn('Could not load email template, using plaintext fallback:', tmplErr && tmplErr.message);
      }

      try {
        await mailer.sendMail(email, 'GameLootMalawi - Password Reset', html);
      } catch (mailErr) {
        console.error('Error sending reset email:', mailErr);
      }

      req.flash('success', 'If an account with that email exists, a reset link has been sent.');
      return res.redirect('/login');
    } catch (err) {
      console.error('Forgot password error:', err);
      req.flash('error', 'Error processing password reset request');
      return res.redirect('/forgot-password');
    }
  });

  router.get('/reset-password', async (req, res) => {
    const { token, email } = req.query;
    return res.render('layout', {
      title: 'Reset Password - GameLootMalawi',
      content: 'pages/reset-password',
      token,
      email
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    router.get('/__dev/emails', (req, res) => {
      const logPath = path.join(process.cwd(), 'tmp', 'emails.log');
      let content = '';
      try {
        content = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : 'No emails logged yet.';
      } catch (err) {
        console.error('Error reading emails log:', err && err.message);
        content = 'Error reading emails log';
      }

      return res.send(
        `<html><head><title>Dev Emails</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}pre{white-space:pre-wrap;background:#f7f7f7;padding:16px;border-radius:6px}</style></head><body><h1>Logged Emails</h1><pre>${content.replace(/</g, '&lt;')}</pre></body></html>`
      );
    });
  }

  router.post('/reset-password', async (req, res) => {
    const { token, email, password, confirmPassword } = req.body;

    if (!token || !email) {
      req.flash('error', 'Invalid reset link');
      return res.redirect('/forgot-password');
    }
    if (!password || password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect(`/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
    }

    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const [rows] = await db.execute('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email]);
      const user = rows[0];
      if (!user) {
        req.flash('error', 'Invalid reset request');
        return res.redirect('/forgot-password');
      }

      const [tokens] = await db.execute('SELECT * FROM password_resets WHERE user_id = ? AND token_hash = ? LIMIT 1', [user.id, tokenHash]);
      const tokenRow = tokens[0];
      if (!tokenRow) {
        req.flash('error', 'Invalid or expired reset link');
        return res.redirect('/forgot-password');
      }

      if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
        await db.execute('DELETE FROM password_resets WHERE id = ?', [tokenRow.id]);
        req.flash('error', 'Reset link has expired');
        return res.redirect('/forgot-password');
      }

      await User.changePassword(user.id, password);
      await db.execute('DELETE FROM password_resets WHERE id = ?', [tokenRow.id]);

      req.flash('success', 'Password reset successful - you may now log in');
      return res.redirect('/login');
    } catch (err) {
      console.error('Reset password error:', err);
      req.flash('error', 'Error resetting password');
      return res.redirect('/forgot-password');
    }
  });

  router.get('/profile', async (req, res) => {
    if (!req.session.user) {
      req.flash('error', 'Please login to view your profile');
      return res.redirect('/login');
    }

    try {
      const cartItems = await Cart.getCartItems(req.session.user.id) || [];
      const total = await Cart.getCartTotal(req.session.user.id) || 0;

      return res.render('layout', {
        title: 'My Profile - GameLootMalawi',
        content: 'pages/profile',
        user: req.session.user,
        cart: cartItems,
        cartTotal: total
      });
    } catch (err) {
      console.error('Error loading profile cart:', err);
      req.flash('error', 'Error loading profile');
      return res.redirect('/');
    }
  });

  router.post('/profile', async (req, res) => {
    if (!req.session.user) {
      req.flash('error', 'Please login to update your profile');
      return res.redirect('/login');
    }

    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const address = String(req.body.address || '').trim();

    if (!name || !email) {
      req.flash('error', 'Username and email are required');
      return res.redirect('/profile');
    }

    try {
      const existingUser = await User.findByEmail(email);
      if (existingUser && Number(existingUser.id) !== Number(req.session.user.id)) {
        req.flash('error', 'That email is already in use by another account');
        return res.redirect('/profile');
      }

      const updatedUser = await User.update(req.session.user.id, {
        name,
        email,
        phone,
        address
      });

      req.session.user = {
        ...req.session.user,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        address: updatedUser.address || ''
      };

      req.flash('success', 'Profile updated successfully');
      return res.redirect('/profile');
    } catch (error) {
      console.error('Profile update error:', error);
      req.flash('error', 'Could not update profile');
      return res.redirect('/profile');
    }
  });

  router.get('/orders', async (req, res) => {
    if (!req.session.user) {
      req.flash('error', 'Please login to view your orders');
      return res.redirect('/login');
    }

    try {
      const page = req.query.page || 1;
      const limit = 50;
      const orders = await Order.findByUserId(req.session.user.id, { page: parseInt(page, 10), limit });
      return res.render('layout', {
        title: 'My Orders - GameLootMalawi',
        content: 'pages/orders',
        orders: orders || [],
        pagination: { page: parseInt(page, 10), limit }
      });
    } catch (err) {
      console.error('Error loading user orders page:', err);
      req.flash('error', 'Error loading your orders');
      return res.render('layout', {
        title: 'My Orders - GameLootMalawi',
        content: 'pages/orders',
        orders: []
      });
    }
  });

  router.get('/orders/:id', async (req, res) => {
    try {
      if (!req.session.user) {
        req.flash('error', 'Please login to view order');
        return res.redirect('/login');
      }

      const orderId = req.params.id;
      const order = await Order.findById(orderId);
      if (!order) {
        req.flash('error', 'Order not found');
        return res.redirect('/orders');
      }

      if (req.session.user.role !== 'admin' && order.user_id !== req.session.user.id) {
        req.flash('error', 'Access denied');
        return res.redirect('/');
      }

      return res.render('layout', {
        title: `Order ${order.order_number || order.id} - GameLootMalawi`,
        content: 'pages/admin-order-detail',
        order,
        currentUser: req.session.user
      });
    } catch (err) {
      console.error('Error loading order detail:', err);
      req.flash('error', 'Error loading order');
      return res.redirect('/orders');
    }
  });

  router.post('/login', loginLimiter, authController.loginHandler);

  router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error('Logout error:', err);
      return res.redirect('/login');
    });
  });

  router.post('/register', createAccountLimiter, async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/register');
    }

    try {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        req.flash('error', 'Email already registered. Please login or use a different email.');
        return res.redirect('/register');
      }

      const newUser = await User.create({
        name,
        email,
        password,
        phone: '',
        address: '',
        role: 'customer'
      });

      req.session.user = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || '',
        address: newUser.address || '',
        role: newUser.role
      };

      req.flash('success', 'Registration successful! Welcome to GameLootMalawi');
      return res.redirect('/profile');
    } catch (error) {
      console.error('Registration error:', error);
      req.flash('error', 'Registration failed. Please try again.');
      return res.redirect('/register');
    }
  });

  router.post('/wishlist/toggle', async (req, res) => {
    if (!req.session.user) return res.json({ success: false, requireLogin: true, message: 'Please login' });
    const { productId } = req.body;
    if (!productId) return res.json({ success: false, message: 'Missing productId' });

    try {
      const result = await Wishlist.toggle(req.session.user.id, parseInt(productId, 10));
      return res.json({ success: true, added: result.added });
    } catch (err) {
      console.error('Wishlist toggle error:', err);
      return res.json({ success: false, message: 'Error toggling wishlist' });
    }
  });

  return router;
};
