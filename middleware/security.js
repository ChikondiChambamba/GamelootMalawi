const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later.'
});

const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many accounts created from this IP, please try again after an hour.'
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many password reset requests, please try again later.'
});

function sameOriginProtection(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (req.path.startsWith('/api/')) return next();
  if (['/login', '/register', '/logout', '/forgot-password', '/reset-password'].includes(req.path)) return next();

  const secFetchSite = req.get('sec-fetch-site');
  if (secFetchSite && !['same-origin', 'same-site', 'none'].includes(secFetchSite)) {
    return res.status(403).json({ success: false, message: 'Blocked by same-origin policy.' });
  }

  const host = req.get('host');
  const origin = req.get('origin');
  const referer = req.get('referer');
  const trustedLoopbackHosts = ['localhost', '127.0.0.1', '[::1]'];

  const isTrustedSourceUrl = (sourceUrl) => {
    try {
      const parsed = new URL(sourceUrl);
      if (parsed.host === host) return true;

      const reqHostNoPort = String(req.hostname || '').toLowerCase();
      const srcHostNoPort = String(parsed.hostname || '').toLowerCase();
      if (trustedLoopbackHosts.includes(reqHostNoPort) && trustedLoopbackHosts.includes(srcHostNoPort)) {
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  if (origin && !isTrustedSourceUrl(origin)) {
    return res.status(403).json({ success: false, message: 'Blocked by same-origin policy.' });
  }
  if (!origin && referer && !isTrustedSourceUrl(referer)) {
    return res.status(403).json({ success: false, message: 'Blocked by same-origin policy.' });
  }
  return next();
}

module.exports = {
  globalLimiter,
  loginLimiter,
  createAccountLimiter,
  forgotPasswordLimiter,
  sameOriginProtection
};
