const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
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
  if (['/login', '/register', '/logout', '/forgot-password', '/reset-password', '/admin/payment-settings'].includes(req.path)) return next();

  const rawOrigin = req.get('origin');
  const origin = rawOrigin === 'null' ? '' : rawOrigin;
  const referer = req.get('referer');
  const trustedLoopbackHosts = ['localhost', '127.0.0.1', '[::1]'];
  const hostHeader = String(req.get('host') || '').toLowerCase();
  const forwardedHostHeader = String(req.get('x-forwarded-host') || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  const trustedHosts = new Set([hostHeader, ...forwardedHostHeader].filter(Boolean));

  const normalizeHostname = (hostname = '') => String(hostname).toLowerCase().replace(/\.$/, '');
  const getBaseDomain = (hostname = '') => {
    const cleaned = normalizeHostname(hostname);
    if (!cleaned || trustedLoopbackHosts.includes(cleaned)) return cleaned;
    const parts = cleaned.split('.');
    if (parts.length <= 2) return cleaned;
    return parts.slice(-2).join('.');
  };

  const isTrustedSourceUrl = (sourceUrl) => {
    try {
      const parsed = new URL(sourceUrl);
      const parsedHost = String(parsed.host || '').toLowerCase();
      if (trustedHosts.has(parsedHost)) return true;

      const reqHostNoPort = String(req.hostname || '').toLowerCase();
      const srcHostNoPort = String(parsed.hostname || '').toLowerCase();
      if (trustedLoopbackHosts.includes(reqHostNoPort) && trustedLoopbackHosts.includes(srcHostNoPort)) {
        return true;
      }

      // Allow sibling subdomains on same base domain (e.g. www.example.com and example.com)
      const requestBase = getBaseDomain(reqHostNoPort);
      const sourceBase = getBaseDomain(srcHostNoPort);
      if (requestBase && sourceBase && requestBase === sourceBase) {
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
  // If neither Origin nor Referer is present, allow the request.
  // Some hosting/proxy setups strip these headers for same-site form posts.
  return next();
}

module.exports = {
  globalLimiter,
  loginLimiter,
  createAccountLimiter,
  forgotPasswordLimiter,
  sameOriginProtection
};
