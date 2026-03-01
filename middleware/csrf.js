const crypto = require('crypto');

function ensureCsrfToken(req, res, next) {
  if (!req.session) return next();
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  return next();
}

function verifyCsrf(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (req.path.startsWith('/api/')) return next();

  const contentType = String(req.get('content-type') || '').toLowerCase();
  if (contentType.includes('multipart/form-data')) {
    // Allow route-level verification for checkout where token is posted in multipart body.
    if (req.path === '/orders') return next();
    const expected = req.session && req.session.csrfToken;
    const provided = req.get('x-csrf-token');
    if (expected && provided && provided === expected) return next();
    return res.status(403).json({ success: false, message: 'Invalid CSRF token.' });
  }

  const expected = req.session && req.session.csrfToken;
  if (!expected) return res.status(403).json({ success: false, message: 'CSRF session token missing.' });

  const provided = req.get('x-csrf-token') || (req.body && req.body._csrf) || (req.query && req.query._csrf);
  if (provided && provided === expected) return next();

  const wantsJson = req.xhr || String(req.get('accept') || '').includes('application/json');
  if (wantsJson) {
    return res.status(403).json({ success: false, message: 'Invalid CSRF token.' });
  }

  if (req.flash && typeof req.flash === 'function') {
    req.flash('error', 'Session expired. Please try again.');
    return res.redirect('back');
  }
  return res.status(403).send('Invalid CSRF token.');
}

module.exports = { ensureCsrfToken, verifyCsrf };
