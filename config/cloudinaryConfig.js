const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

function parseCloudinaryUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return {
      cloud_name: parsed.hostname || '',
      api_key: decodeURIComponent(parsed.username || ''),
      api_secret: decodeURIComponent(parsed.password || '')
    };
  } catch (e) {
    return null;
  }
}

function hasCloudinaryEnv() {
  const splitEnvReady = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  const urlEnvReady = Boolean(process.env.CLOUDINARY_URL);
  return splitEnvReady || urlEnvReady;
}

const parsedCloudinaryUrl = process.env.CLOUDINARY_URL
  ? parseCloudinaryUrl(process.env.CLOUDINARY_URL)
  : null;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || (parsedCloudinaryUrl && parsedCloudinaryUrl.cloud_name),
  api_key: process.env.CLOUDINARY_API_KEY || (parsedCloudinaryUrl && parsedCloudinaryUrl.api_key),
  api_secret: process.env.CLOUDINARY_API_SECRET || (parsedCloudinaryUrl && parsedCloudinaryUrl.api_secret),
  secure: true
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'gameloot_products', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  })
});

const upload = multer({ storage });

module.exports = { cloudinary, upload, hasCloudinaryEnv };
