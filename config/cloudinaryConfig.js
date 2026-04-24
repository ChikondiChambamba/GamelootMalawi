const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

function clean(value) {
  return String(value || '').trim();
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function parseCloudinaryUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return {
      cloud_name: clean(parsed.hostname || ''),
      api_key: clean(decodeURIComponent(parsed.username || '')),
      api_secret: clean(decodeURIComponent(parsed.password || ''))
    };
  } catch (e) {
    return null;
  }
}

function parseLooseCloudinaryAuth(rawValue) {
  // Handles malformed value patterns like: "<api_key>:<api_secret>@<cloud_name>"
  // that are sometimes mistakenly placed in CLOUDINARY_API_SECRET.
  const value = clean(rawValue);
  const match = value.match(/^([^:]+):([^@]+)@(.+)$/);
  if (!match) return null;
  return {
    api_key: clean(match[1]),
    api_secret: clean(match[2]),
    cloud_name: clean(match[3])
  };
}

function resolveCloudinaryConfig() {
  const fromUrl = process.env.CLOUDINARY_URL
    ? parseCloudinaryUrl(process.env.CLOUDINARY_URL)
    : null;

  let cloud_name = clean(process.env.CLOUDINARY_CLOUD_NAME || (fromUrl && fromUrl.cloud_name));
  let api_key = clean(process.env.CLOUDINARY_API_KEY || (fromUrl && fromUrl.api_key));
  let api_secret = clean(process.env.CLOUDINARY_API_SECRET || (fromUrl && fromUrl.api_secret));

  const loose = parseLooseCloudinaryAuth(api_secret);
  if (loose) {
    api_key = api_key || loose.api_key;
    api_secret = loose.api_secret;
    cloud_name = cloud_name || loose.cloud_name;
  }

  return { cloud_name, api_key, api_secret };
}

function hasCloudinaryEnv() {
  const cfg = resolveCloudinaryConfig();
  const hasCreds = Boolean(cfg.cloud_name && cfg.api_key && cfg.api_secret);
  const isProdLike = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
  const devExplicitEnable = parseBool(process.env.CLOUDINARY_ENABLED, false);

  // Production-like environments must use Cloudinary when credentials are present.
  if (isProdLike) {
    if (!hasCreds) {
      console.warn('[cloudinary] Production-like runtime detected but Cloudinary credentials are missing. Falling back to local uploads.');
      return false;
    }
    return true;
  }

  // In development, default to local disk uploads unless explicitly enabled.
  return hasCreds && devExplicitEnable;
}

const cloudCfg = resolveCloudinaryConfig();

cloudinary.config({
  cloud_name: cloudCfg.cloud_name,
  api_key: cloudCfg.api_key,
  api_secret: cloudCfg.api_secret,
  secure: true
});

const productStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'gameloot_products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  })
});

const receiptStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'gameloot_receipts',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    resource_type: 'image',
    public_id: `receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}`.replace(/\s+/g, '-')
  })
});

function imageFileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Invalid receipt file type. Upload JPG, PNG, or WEBP.'), false);
  }
  return cb(null, true);
}

const upload = multer({ storage: productStorage });
const receiptUpload = multer({
  storage: receiptStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { cloudinary, upload, receiptUpload, hasCloudinaryEnv };
