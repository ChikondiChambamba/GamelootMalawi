function formatMeta(meta = {}) {
  try {
    return Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  } catch (e) {
    return '';
  }
}

function log(level, message, meta = {}) {
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[${ts}] [${level}] ${message}${formatMeta(meta)}`);
}

module.exports = {
  info(message, meta) {
    log('INFO', message, meta);
  },
  warn(message, meta) {
    log('WARN', message, meta);
  },
  error(message, meta) {
    log('ERROR', message, meta);
  }
};

