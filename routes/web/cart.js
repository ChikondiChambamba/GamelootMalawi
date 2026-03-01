const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const Order = require('../../models/order');
const PaymentSettings = require('../../models/PaymentSettings');
const mailer = require('../../utils/mailer');
const { buildInvoicePdf } = require('../../utils/invoicePdf');

const router = express.Router();

const receiptStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      // continue
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

function receiptFileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Invalid receipt file type. Upload JPG, PNG, or WEBP.'), false);
  }
  return cb(null, true);
}

const uploadReceipt = multer({
  storage: receiptStorage,
  fileFilter: receiptFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('paymentReceipt');

function getGuestCartRaw(req) {
  if (!req.session.guestCart) req.session.guestCart = [];
  return req.session.guestCart;
}

async function getGuestCartItems(req) {
  const guestCart = getGuestCartRaw(req);
  const items = [];

  for (const entry of guestCart) {
    const product = await Product.findById(entry.productId);
    if (!product) continue;
    const quantity = Number(entry.quantity) || 1;
    items.push({
      product_id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image_url: product.image_url,
      stock_quantity: Number(product.stock_quantity) || 0,
      quantity
    });
  }

  return items;
}

async function getCartViewData(req) {
  if (req.session.user) {
    const items = await Cart.getCartItems(req.session.user.id);
    const total = await Cart.getCartTotal(req.session.user.id);
    return { items: items || [], total: Number(total) || 0 };
  }

  const items = await getGuestCartItems(req);
  const total = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  return { items, total };
}

function createCheckoutNonce(req) {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  req.session.checkoutNonce = nonce;
  return nonce;
}

router.get('/cart', async (req, res) => {
  try {
    const { items, total } = await getCartViewData(req);
    res.render('layout', {
      title: 'Shopping Cart - GameLootMalawi',
      content: 'pages/cart',
      cart: items,
      total
    });
  } catch (err) {
    console.error('Cart page error:', err);
    req.flash('error', 'Error loading cart');
    res.redirect('/');
  }
});

router.get('/checkout', async (req, res) => {
  try {
    const { items, total } = await getCartViewData(req);
    if (items.length === 0) {
      req.flash('error', 'Your cart is empty');
      return res.redirect('/cart');
    }

    const paymentSettings = await PaymentSettings.get();

    const checkoutNonce = createCheckoutNonce(req);

    res.render('layout', {
      title: 'Checkout - GameLootMalawi',
      content: 'pages/checkout',
      cart: items,
      total,
      paymentSettings,
      checkoutNonce
    });
  } catch (err) {
    console.error('Checkout page error:', err);
    req.flash('error', 'Error loading checkout');
    res.redirect('/cart');
  }
});

router.post('/cart/add', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  try {
    const product = await Product.findById(productId);
    if (!product) return res.json({ success: false, message: 'Product not found' });
    if (Number(product.stock_quantity) < qty) return res.json({ success: false, message: 'Insufficient stock available' });

    if (req.session.user) {
      await Cart.addItem(req.session.user.id, productId, qty);
      const cartCount = await Cart.getCartCount(req.session.user.id);
      return res.json({ success: true, message: 'Product added to cart', cartCount });
    }

    const guestCart = getGuestCartRaw(req);
    const existing = guestCart.find((i) => Number(i.productId) === Number(productId));
    if (existing) {
      existing.quantity = Number(existing.quantity) + qty;
    } else {
      guestCart.push({ productId: Number(productId), quantity: qty });
    }
    req.session.guestCart = guestCart;
    const cartCount = guestCart.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    return res.json({ success: true, message: 'Product added to cart', cartCount });
  } catch (err) {
    console.error('Cart add error:', err);
    return res.json({ success: false, message: 'Error adding to cart' });
  }
});

router.post('/cart/update', async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity, 10) || 0;

  try {
    if (req.session.user) {
      await Cart.updateQuantity(req.session.user.id, parseInt(productId, 10), qty);
      const cartCount = await Cart.getCartCount(req.session.user.id);
      return res.json({ success: true, message: 'Cart updated', cartCount });
    }

    const guestCart = getGuestCartRaw(req);
    const idx = guestCart.findIndex((i) => Number(i.productId) === Number(productId));
    if (idx >= 0) {
      if (qty <= 0) guestCart.splice(idx, 1);
      else guestCart[idx].quantity = qty;
    }
    req.session.guestCart = guestCart;
    const cartCount = guestCart.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    return res.json({ success: true, message: 'Cart updated', cartCount });
  } catch (err) {
    console.error('Cart update error:', err);
    return res.json({ success: false, message: 'Error updating cart' });
  }
});

router.post('/cart/remove', async (req, res) => {
  const { productId } = req.body;

  try {
    if (req.session.user) {
      await Cart.removeItem(req.session.user.id, parseInt(productId, 10));
      const cartCount = await Cart.getCartCount(req.session.user.id);
      return res.json({ success: true, message: 'Product removed from cart', cartCount });
    }

    const guestCart = getGuestCartRaw(req).filter((i) => Number(i.productId) !== Number(productId));
    req.session.guestCart = guestCart;
    const cartCount = guestCart.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    return res.json({ success: true, message: 'Product removed from cart', cartCount });
  } catch (err) {
    console.error('Cart remove error:', err);
    return res.json({ success: false, message: 'Error removing from cart' });
  }
});

router.post('/orders', (req, res, next) => {
  uploadReceipt(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      req.flash('error', err.code === 'LIMIT_FILE_SIZE' ? 'Receipt image too large (max 5MB)' : 'Receipt upload failed');
      return res.redirect('/checkout');
    }
    if (err) {
      req.flash('error', err.message || 'Receipt upload failed');
      return res.redirect('/checkout');
    }
    return next();
  });
}, async (req, res) => {
  const { fullName, phone, address, city, postalCode, paymentMethod, email } = req.body;

  try {
    const csrfProvided = String(req.body._csrf || '');
    const csrfExpected = String((req.session && req.session.csrfToken) || '');
    if (!csrfProvided || !csrfExpected || csrfProvided !== csrfExpected) {
      req.flash('error', 'Session expired. Please refresh checkout and try again.');
      return res.redirect('/checkout');
    }

    if (req.session.orderSubmitInFlight) {
      req.flash('error', 'Order is already being processed. Please wait.');
      return res.redirect('/checkout');
    }

    const providedNonce = String(req.body.orderNonce || '');
    const expectedNonce = String(req.session.checkoutNonce || '');
    if (!providedNonce || !expectedNonce || providedNonce !== expectedNonce) {
      req.flash('error', 'Checkout session expired. Please review your cart and try again.');
      return res.redirect('/checkout');
    }

    const { items } = await getCartViewData(req);
    if (!items || items.length === 0) {
      req.flash('error', 'Your cart is empty');
      return res.redirect('/cart');
    }

    const customerEmail = (req.session.user && req.session.user.email) ? req.session.user.email : (email || '').trim();
    if (!customerEmail) {
      req.flash('error', 'Email is required to place your order');
      return res.redirect('/checkout');
    }

    req.session.orderSubmitInFlight = true;
    req.session.checkoutNonce = null;

    const normalizedItems = items.map((item) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.price) || 0,
      total_price: (Number(item.quantity) || 1) * (Number(item.price) || 0)
    }));
    const totalAmount = normalizedItems.reduce((sum, item) => sum + item.total_price, 0);
    const shippingAddress = `${address || ''}, ${city || ''}${postalCode ? ` (${postalCode})` : ''}`.trim();
    const normalizedPaymentMethod = paymentMethod === 'cash_on_delivery' ? 'cash_on_delivery' : 'shop_pay';

    if (normalizedPaymentMethod === 'shop_pay' && !req.file) {
      req.flash('error', 'Please upload your payment receipt for bank/mobile money transfer.');
      return res.redirect('/checkout');
    }

    const paymentReceiptUrl = req.file ? `/uploads/receipts/${req.file.filename}` : null;
    const siteBaseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

    const orderData = {
      user_id: req.session.user ? req.session.user.id : null,
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
      customer_name: fullName || (req.session.user ? req.session.user.name : 'Customer'),
      customer_email: customerEmail,
      customer_phone: phone || (req.session.user ? req.session.user.phone : ''),
      payment_method: normalizedPaymentMethod,
      payment_receipt_url: paymentReceiptUrl,
      notes: paymentReceiptUrl ? `Payment receipt: ${paymentReceiptUrl}` : null
    };

    let order;
    try {
      order = await Order.create(orderData, normalizedItems);
    } catch (createErr) {
      const msg = String(createErr && createErr.message ? createErr.message : '').toLowerCase();
      const isEnumIssue = msg.includes('incorrect enum value') || msg.includes('data truncated for column');
      if (isEnumIssue && orderData.payment_method === 'shop_pay') {
        const fallbackOrderData = { ...orderData, payment_method: 'credit_card' };
        order = await Order.create(fallbackOrderData, normalizedItems);
        orderData.payment_method = 'shop_pay';
      } else {
        throw createErr;
      }
    }

    if (req.session.user) await Cart.clearCart(req.session.user.id);
    else req.session.guestCart = [];

    const listItems = items
      .map((i, idx) => {
        const qty = Number(i.quantity) || 1;
        const unitPrice = Number(i.price) || 0;
        const lineTotal = qty * unitPrice;
        return `<li>${idx + 1}. ${i.name} - Qty ${qty} x MWK ${unitPrice.toLocaleString()} = MWK ${lineTotal.toLocaleString()}</li>`;
      })
      .join('');

    try {
      const invoicePdf = await buildInvoicePdf({
        order: {
          ...orderData,
          order_number: order.order_number || order.id
        },
        items,
        shippingAddress
      });
      const invoiceAttachment = {
        filename: `invoice-${order.order_number || order.id}.pdf`,
        content: invoicePdf,
        contentType: 'application/pdf'
      };

      const customerHtml = `
        <h2>Order Confirmation</h2>
        <p>Hi ${orderData.customer_name}, your order has been placed successfully.</p>
        <p><strong>Order #:</strong> ${order.order_number || order.id}</p>
        <p><strong>Total:</strong> MWK ${Number(totalAmount).toLocaleString()}</p>
        <p><strong>Payment Method:</strong> ${orderData.payment_method}</p>
        <p><strong>Shipping Address:</strong> ${shippingAddress}</p>
        ${paymentReceiptUrl ? `<p><strong>Payment Receipt:</strong> <a href="${siteBaseUrl}${paymentReceiptUrl}">View uploaded receipt</a></p>` : ''}
        <h4>Order Items</h4>
        <ul>${listItems}</ul>
      `;

      try {
        await mailer.sendMail(
          customerEmail,
          `GameLootMalawi Order Confirmation - ${order.order_number || order.id}`,
          customerHtml,
          { attachments: [invoiceAttachment] }
        );
      } catch (mailErr) {
        console.error('Order confirmation email send failed:', mailErr);
      }

      const adminEmail = process.env.ADMIN_INVOICE_EMAIL || process.env.SMTP_FROM;
      if (adminEmail) {
        const adminHtml = `
          <h2>New Order Invoice</h2>
          <p><strong>Order #:</strong> ${order.order_number || order.id}</p>
          <p><strong>Customer:</strong> ${orderData.customer_name} (${customerEmail})</p>
          <p><strong>Phone:</strong> ${orderData.customer_phone || 'N/A'}</p>
          <p><strong>Payment Method:</strong> ${orderData.payment_method}</p>
          <p><strong>Shipping Address:</strong> ${shippingAddress}</p>
          ${paymentReceiptUrl ? `<p><strong>Payment Receipt:</strong> <a href="${siteBaseUrl}${paymentReceiptUrl}">${siteBaseUrl}${paymentReceiptUrl}</a></p>` : ''}
          <p><strong>Total:</strong> MWK ${Number(totalAmount).toLocaleString()}</p>
          <h4>Items</h4>
          <ul>${listItems}</ul>
        `;
        try {
          const attachments = [invoiceAttachment];
          if (req.file) {
            attachments.push({
              filename: req.file.originalname || 'payment-receipt',
              path: req.file.path
            });
          }
          await mailer.sendMail(
            adminEmail,
            `Invoice - New Order ${order.order_number || order.id}`,
            adminHtml,
            { attachments }
          );
        } catch (mailErr) {
          console.error('Admin invoice email send failed:', mailErr);
        }
      }
    } catch (invoiceErr) {
      console.error('Invoice generation failed, order was still created:', invoiceErr);
    }

    req.session.lastOrderSuccess = {
      orderNumber: order.order_number || String(order.id),
      email: customerEmail,
      totalAmount
    };
    req.session.orderSubmitInFlight = false;
    return res.redirect(`/order-success/${encodeURIComponent(order.order_number || order.id)}`);
  } catch (err) {
    req.session.orderSubmitInFlight = false;
    console.error('Place order error:', err);
    const msg = String(err && err.message ? err.message : '');
    if (msg.toLowerCase().includes('enum') || msg.toLowerCase().includes('data truncated')) {
      req.flash('error', 'Could not place order because payment configuration is incompatible. Please contact support.');
    } else if (msg.toLowerCase().includes('unknown column') || msg.toLowerCase().includes('alter command denied')) {
      req.flash('error', 'Could not place order due to database schema mismatch. Please contact support.');
    } else {
      const detailed = process.env.NODE_ENV !== 'production'
        ? `Could not place order: ${msg || 'Unknown error'}`
        : 'Could not place order. Please try again.';
      req.flash('error', detailed);
    }
    return res.redirect('/checkout');
  }
});

router.get('/order-success/:orderNumber', async (req, res) => {
  const orderNumber = String(req.params.orderNumber || '');
  const info = req.session.lastOrderSuccess || null;
  if (!info || String(info.orderNumber) !== orderNumber) {
    req.flash('error', 'Order confirmation not found.');
    return res.redirect('/shop');
  }

  req.session.lastOrderSuccess = null;
  return res.render('layout', {
    title: `Order ${orderNumber} Confirmed - GameLootMalawi`,
    content: 'pages/order-success',
    orderNumber,
    customerEmail: info.email,
    totalAmount: info.totalAmount
  });
});

module.exports = router;
