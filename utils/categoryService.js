const db = require('../config/database');

const CATEGORY_CACHE_TTL_MS = 60 * 1000;
const categoryCache = {
  active: { data: null, expiresAt: 0 },
  all: { data: null, expiresAt: 0 }
};

const CATEGORY_VISUALS = {
  consoles: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?auto=format&fit=crop&w=1400&q=80',
  games: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80',
  accessories: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&w=1400&q=80',
  electronics: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
  deals: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1400&q=80'
};

function getCategoryVisual(slug) {
  if (!slug) return null;
  return CATEGORY_VISUALS[String(slug).toLowerCase()] || null;
}

function addCategoryVisuals(categories = []) {
  return categories.map((cat) => ({
    ...cat,
    image_url: getCategoryVisual(cat.slug)
  }));
}

async function getCachedCategories(activeOnly = true) {
  const key = activeOnly ? 'active' : 'all';
  const cache = categoryCache[key];
  const now = Date.now();
  if (cache.data && cache.expiresAt > now) return cache.data;

  const sql = activeOnly
    ? 'SELECT * FROM categories WHERE is_active = TRUE ORDER BY name ASC'
    : 'SELECT * FROM categories ORDER BY name ASC';

  const [rows] = await db.execute(sql);
  const data = Array.isArray(rows) ? rows : [];
  categoryCache[key] = { data, expiresAt: now + CATEGORY_CACHE_TTL_MS };
  return data;
}

function invalidateCategoryCache() {
  categoryCache.active = { data: null, expiresAt: 0 };
  categoryCache.all = { data: null, expiresAt: 0 };
}

module.exports = {
  getCategoryVisual,
  addCategoryVisuals,
  getCachedCategories,
  invalidateCategoryCache
};

