function toPublicFileUrl(filePath) {
  if (!filePath) return null;
  const normalized = String(filePath).replace(/\\/g, '/');

  if (/^https?:\/\//i.test(normalized)) return normalized;

  const publicMarker = '/public/';
  const markerIndex = normalized.indexOf(publicMarker);
  if (markerIndex >= 0) {
    return normalized.slice(markerIndex + '/public'.length);
  }

  if (normalized.startsWith('public/')) {
    return `/${normalized.slice('public/'.length)}`;
  }

  if (normalized.startsWith('/uploads/')) return normalized;
  if (normalized.startsWith('uploads/')) return `/${normalized}`;

  return normalized;
}

module.exports = { toPublicFileUrl };
