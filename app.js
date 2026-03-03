const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const helmet = require('helmet');
require('dotenv').config();
const logger = require('./utils/logger');
const { ensureCsrfToken, verifyCsrf } = require('./middleware/csrf');

const Cart = require('./models/Cart');
const {
  globalLimiter,
  loginLimiter,
  createAccountLimiter,
  forgotPasswordLimiter,
  sameOriginProtection
} = require('./middleware/security');

const storefrontRoutes = require('./routes/web/storefront');
const cartRoutes = require('./routes/web/cart');
const adminRoutes = require('./routes/web/admin');
const createAccountRoutes = require('./routes/web/account');
const rewardsRoutes = require('./routes/web/rewards');
const dealsRoutes = require('./routes/web/deals');

const apiAuthRoutes = require('./routes/auth');
const apiProductRoutes = require('./routes/product');
const apiOrderRoutes = require('./routes/order');
const apiCategoryRoutes = require('./routes/categories');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production.');
}

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://code.jquery.com'],
      scriptSrcElem: ["'self'", 'https://cdn.jsdelivr.net', 'https://code.jquery.com'],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com', "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://res.cloudinary.com'],
      connectSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: isProd ? undefined : false
}));

app.use(globalLimiter);
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(methodOverride('_method'));
app.use(sameOriginProtection);
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  maxAge: isProd ? '1d' : 0
}));

app.use(session({
  name: 'glm.sid',
  secret: process.env.SESSION_SECRET || 'dev-only-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(flash());
app.use(ensureCsrfToken);
app.use(verifyCsrf);

app.get('/health', (req, res) => {
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  let uploadsWritable = true;
  try {
    fs.accessSync(uploadsDir, fs.constants.W_OK);
  } catch (e) {
    uploadsWritable = false;
  }

  res.status(200).json({
    ok: true,
    service: 'gamelootmalawi',
    env: process.env.NODE_ENV || 'development',
    uploads_writable: uploadsWritable,
    uptime_sec: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.use(async (req, res, next) => {
  res.locals.currentUser = (req.session && req.session.user) ? req.session.user : null;
  res.locals.cartCount = 0;
  res.locals.searchTerm = (req.query && req.query.search) ? req.query.search : '';
  res.locals.currentSection = res.locals.currentSection || '';
  res.locals.category = res.locals.category || null;
  res.locals.products = res.locals.products || [];

  if (req.flash && typeof req.flash === 'function') {
    res.locals.success = req.flash('success') || [];
    res.locals.error = req.flash('error') || [];
  } else {
    res.locals.success = res.locals.success || [];
    res.locals.error = res.locals.error || [];
  }

  if (req.session && req.session.user) {
    try {
      res.locals.cartCount = await Cart.getCartCount(req.session.user.id);
    } catch (err) {
      console.error('Error getting cart count:', err);
      res.locals.cartCount = 0;
    }
  } else if (req.session && Array.isArray(req.session.guestCart)) {
    res.locals.cartCount = req.session.guestCart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }

  next();
});


app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - start
    });
  });
  next();
});

app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'views/pages'),
  path.join(__dirname, 'views/partials')
]);

app.use('/', storefrontRoutes);
app.use('/', cartRoutes);
app.use('/', createAccountRoutes({ loginLimiter, createAccountLimiter, forgotPasswordLimiter }));
app.use('/', adminRoutes);
app.use('/', rewardsRoutes);
app.use('/', dealsRoutes);

// Wire previously-unused API routers
app.use('/api/auth', apiAuthRoutes);
app.use('/api/products', apiProductRoutes);
app.use('/api/orders', apiOrderRoutes);
app.use('/api/categories', apiCategoryRoutes);

app.use((err, req, res, next) => {
  logger.error('unhandled_error', { message: err && err.message, stack: err && err.stack });
  if (req.xhr || (req.headers && req.headers.accept && req.headers.accept.includes('json'))) {
    return res.status(err.status || 500).json({ success: false, message: 'Server error' });
  }
  try {
    if (req.flash && typeof req.flash === 'function') req.flash('error', 'Internal Server Error');
  } catch (e) {
    console.error('Flash error:', e);
  }
  return res.status(err.status || 500).redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info('server_started', { port: PORT, url: `http://localhost:${PORT}` });
});
