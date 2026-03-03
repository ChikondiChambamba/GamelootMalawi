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

function getUploadedFileUrl(file) {
  if (!file) return null;
  const raw =
    file.path ||
    file.secure_url ||
    file.url ||
    file.location ||
    null;
  return toPublicFileUrl(raw);
}

module.exports = { toPublicFileUrl, getUploadedFileUrl };
