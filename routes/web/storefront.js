const express = require('express');
const Product = require('../../models/Product');
const Promotion = require('../../models/Promotion');
const db = require('../../config/database');
const {
  getCategoryVisual,
  addCategoryVisuals,
  getCachedCategories
} = require('../../utils/categoryService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [featuredRes, allRes, categoriesRes] = await Promise.allSettled([
      Product.findFeatured(6),
      Product.findAllSimple(12, 0),
      getCachedCategories(true)
    ]);

    const featuredProducts = (featuredRes.status === 'fulfilled' && Array.isArray(featuredRes.value)) ? featuredRes.value : [];
    const allProducts = (allRes.status === 'fulfilled' && Array.isArray(allRes.value)) ? allRes.value : [];
    const categoriesRaw = (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)) ? categoriesRes.value : [];
    const categories = addCategoryVisuals(categoriesRaw);

    res.render('layout', {
      title: 'GameLootMalawi - Premium Gaming & Electronics',
      content: 'pages/home',
      featuredProducts,
      allProducts,
      categories,
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Home route error:', error);
    res.render('layout', {
      title: 'GameLootMalawi - Premium Gaming & Electronics',
      content: 'pages/home',
      featuredProducts: [],
      categories: [],
      currentUser: req.session.user
    });
  }
});

router.get('/shop', async (req, res) => {
  const { category, search, page = 1 } = req.query;
  const limit = 20;

  try {
    const [resultRes, categoriesRes, promotionRes] = await Promise.allSettled([
      Product.findAll({ page: parseInt(page, 10) || 1, limit, category, search }),
      getCachedCategories(true),
      category === 'deals' ? Promotion.getActivePromotion() : Promise.resolve(null)
    ]);

    const result = resultRes.status === 'fulfilled' ? resultRes.value : { products: [], pagination: {} };
    const products = result.products || [];
    const categoriesRaw = (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)) ? categoriesRes.value : [];
    const categories = addCategoryVisuals(categoriesRaw);

    let promotion = promotionRes.status === 'fulfilled' ? promotionRes.value : null;
    let winners = [];
    if (promotion) {
      try {
        winners = await Promotion.getWinners(promotion.id);
      } catch (promoErr) {
        console.error('Could not load promotion data:', promoErr);
      }
    }

    res.render('layout', {
      title: 'Shop All Products - GameLootMalawi',
      content: 'pages/shop',
      products,
      categories,
      currentCategory: category,
      currentCategoryImage: getCategoryVisual(category),
      searchTerm: search,
      pagination: result.pagination || {},
      promotion,
      promotionWinners: winners
    });
  } catch (err) {
    console.error('Shop route error:', err);
    req.flash('error', 'Could not load products');
    res.redirect('/');
  }
});

router.get('/category/:slug', async (req, res) => {
  const { slug } = req.params;
  const page = req.query.page || 1;
  const limit = 20;

  try {
    const [catRows] = await db.execute('SELECT * FROM categories WHERE slug = ? LIMIT 1', [slug]);
    if (!catRows || catRows.length === 0) {
      req.flash('error', 'Category not found');
      return res.redirect('/shop');
    }

    const category = {
      ...catRows[0],
      image_url: getCategoryVisual(catRows[0].slug)
    };

    const [productsRes, categoriesRes] = await Promise.allSettled([
      Product.findByCategory(slug, { page: parseInt(page, 10) || 1, limit }),
      getCachedCategories(true)
    ]);

    const products = (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) ? productsRes.value : [];
    const categoriesRaw = (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)) ? categoriesRes.value : [];
    const categories = addCategoryVisuals(categoriesRaw);

    res.render('layout', {
      title: `${category.name} - GameLootMalawi`,
      content: 'pages/shop',
      products,
      categories,
      currentCategory: slug,
      currentCategoryImage: category.image_url,
      category
    });
  } catch (err) {
    console.error('Category page error:', err);
    req.flash('error', 'Could not load category');
    res.redirect('/shop');
  }
});

router.get('/product/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/shop');
    }

    let relatedProducts = [];
    try {
      relatedProducts = await Product.findByCategory(product.category_slug, { page: 1, limit: 4 });
      relatedProducts = (Array.isArray(relatedProducts) ? relatedProducts : relatedProducts.products || [])
        .filter((p) => p.id !== product.id)
        .slice(0, 4);
    } catch (err) {
      console.error('Could not load related products:', err);
    }

    res.render('layout', {
      title: `${product.name} - GameLootMalawi`,
      content: 'pages/product-detail',
      product,
      relatedProducts
    });
  } catch (err) {
    console.error('Product page error:', err);
    req.flash('error', 'Error loading product');
    res.redirect('/shop');
  }
});

module.exports = router;
