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
const customerServicePages = {
  contact: {
    slug: 'contact',
    title: 'Contact Us - GameLootMalawi',
    heading: 'Contact Customer Service',
    intro: 'Reach our team for order updates, stock checks, payment guidance, and post-purchase support. We answer fastest during store hours and keep all order conversations tied to your order number.',
    cards: [
      {
        icon: 'fas fa-phone-volume',
        title: 'Call or WhatsApp',
        body: '+265 880 50 70 78 or +265 988 47 72 30 for urgent order help and product availability.'
      },
      {
        icon: 'fas fa-envelope-open-text',
        title: 'Email Support',
        body: 'Email gamelootmalawi@gmail.com with your order number, phone number, and issue so we can follow up clearly.'
      },
      {
        icon: 'fas fa-store',
        title: 'Visit Us',
        body: 'We serve customers from Lilongwe, Malawi. In-store visits are helpful for warranty inspection, exchanges, and product demonstrations.'
      }
    ],
    panels: [
      {
        title: 'Best way to get help quickly',
        items: [
          'Include your order number in every message.',
          'Mention the exact product name and problem.',
          'Attach receipt or proof of payment for payment-related help.',
          'Use WhatsApp or phone for same-day delivery questions.'
        ]
      },
      {
        title: 'Support hours',
        items: [
          'Monday to Saturday: 9:00 AM to 6:00 PM',
          'Sunday and public holidays: responses may be delayed',
          'Messages sent after hours are handled the next business day'
        ]
      }
    ],
    faqs: [
      {
        question: 'What details should I send when asking for help?',
        answer: 'Send your order number, full name, contact phone, the product involved, and a short summary of the issue. Photos help for damaged or faulty items.'
      },
      {
        question: 'Can I ask for product recommendations before buying?',
        answer: 'Yes. We can help match consoles, accessories, storage, and gadgets to your budget and preferred use case.'
      }
    ]
  },
  faq: {
    slug: 'faq',
    title: 'FAQs - GameLootMalawi',
    heading: 'Frequently Asked Questions',
    intro: 'These answers cover the questions customers ask most often before and after checkout. If your issue is not covered here, contact customer service with your order details.',
    cards: [
      {
        icon: 'fas fa-credit-card',
        title: 'Payments',
        body: 'We support the payment methods shown at checkout. For transfer-based payments, submit proof of payment clearly to avoid processing delays.'
      },
      {
        icon: 'fas fa-truck-fast',
        title: 'Deliveries',
        body: 'Delivery timing depends on your location, stock readiness, and payment confirmation. We keep customers updated when there is a delay.'
      },
      {
        icon: 'fas fa-shield-halved',
        title: 'After-Sales Support',
        body: 'Warranty and exchange decisions depend on item condition, proof of purchase, and whether the issue is due to defect or misuse.'
      }
    ],
    faqs: [
      {
        question: 'How do I know if a product is in stock?',
        answer: 'The product page stock indicator is the first guide, but fast-moving items can change quickly. Contact us for confirmation on high-demand items.'
      },
      {
        question: 'When is my order confirmed?',
        answer: 'Orders are confirmed after we receive the request and validate the payment method or receipt where required.'
      },
      {
        question: 'Can I change my order after placing it?',
        answer: 'Yes, if packing or dispatch has not started. Contact support immediately with your order number and requested change.'
      },
      {
        question: 'Do you issue invoices?',
        answer: 'Yes. The system generates invoices for orders, and customer/admin emails can include invoice attachments when mail delivery is configured correctly.'
      },
      {
        question: 'What if I entered the wrong phone number or address?',
        answer: 'Contact support as soon as possible. The earlier we receive the correction, the easier it is to update before dispatch.'
      }
    ]
  },
  shipping: {
    slug: 'shipping',
    title: 'Shipping Policy - GameLootMalawi',
    heading: 'Shipping Policy',
    intro: 'Our shipping policy is designed to keep order expectations clear from payment through delivery. Delivery estimates are guidelines and can change with stock movement, route availability, or public-holiday schedules.',
    cards: [
      {
        icon: 'fas fa-box-open',
        title: 'Order Processing',
        body: 'Orders are prepared after checkout review and, where applicable, payment receipt verification. Processing can be delayed if the receipt is unreadable or missing key details.'
      },
      {
        icon: 'fas fa-route',
        title: 'Delivery Coverage',
        body: 'We prioritize safe and traceable delivery. Delivery options may differ by location, item size, and urgency.'
      },
      {
        icon: 'fas fa-file-signature',
        title: 'Receiving Orders',
        body: 'Customers should inspect packaging on receipt and report visible damage promptly so we can investigate with the delivery partner.'
      }
    ],
    panels: [
      {
        title: 'General shipping expectations',
        items: [
          'Processing starts after checkout data is complete.',
          'Large or fragile products may require extra handling time.',
          'Rural or out-of-route deliveries can take longer than urban deliveries.',
          'Customers may be contacted to confirm landmarks or alternate contact details.'
        ]
      },
      {
        title: 'Delays and exceptions',
        items: [
          'Stock transfers, weather, public holidays, and carrier issues can affect timing.',
          'We will contact you if we cannot ship within the expected window.',
          'Incorrect contact or address information may delay delivery.'
        ]
      }
    ],
    faqs: [
      {
        question: 'How do I track my order?',
        answer: 'For now, order tracking updates are handled through customer communication rather than a self-serve tracking portal. Keep your phone line reachable after purchase.'
      },
      {
        question: 'Do shipping fees vary?',
        answer: 'Yes. Delivery cost can depend on location, courier arrangement, and the size or value of the product.'
      }
    ]
  },
  returns: {
    slug: 'returns',
    title: 'Returns & Exchanges - GameLootMalawi',
    heading: 'Returns & Exchanges',
    intro: 'We review return and exchange requests carefully so genuine product issues are handled fairly while protecting the business from abuse. Approval depends on product condition, packaging, and proof of purchase.',
    cards: [
      {
        icon: 'fas fa-rotate-left',
        title: 'Eligible Returns',
        body: 'Items reported quickly after delivery and kept in good condition are easier to assess for return or exchange eligibility.'
      },
      {
        icon: 'fas fa-ban',
        title: 'Non-Eligible Cases',
        body: 'Items with physical damage caused after delivery, missing accessories, or signs of misuse may not qualify for return or exchange.'
      },
      {
        icon: 'fas fa-receipt',
        title: 'Proof Required',
        body: 'Keep your order receipt, packaging, and any included accessories. We may request photos before approving the next step.'
      }
    ],
    panels: [
      {
        title: 'Recommended return process',
        items: [
          'Contact customer service first before sending anything back.',
          'Describe the issue and attach clear photos or videos.',
          'Wait for confirmation on drop-off, pickup, or inspection steps.',
          'Bring all accessories, manuals, and the original packaging where possible.'
        ]
      },
      {
        title: 'Exchange considerations',
        items: [
          'Exchanges depend on stock availability.',
          'If the same product is unavailable, store credit or another remedy may be discussed.',
          'Price differences for exchanged items may need to be settled before completion.'
        ]
      }
    ],
    faqs: [
      {
        question: 'How soon should I report a problem?',
        answer: 'As soon as you notice it. Faster reporting makes validation easier and improves the chance of a smooth resolution.'
      },
      {
        question: 'Can I return software, games, or opened sealed products?',
        answer: 'Opened or activation-based products may be restricted unless there is a proven defect. This protects product integrity and licensing rules.'
      }
    ]
  },
  warranty: {
    slug: 'warranty',
    title: 'Warranty - GameLootMalawi',
    heading: 'Warranty Information',
    intro: 'Warranty support is focused on manufacturer defects and verified faults under normal use. Coverage may differ by product type, supplier, and whether the item is new, refurbished, or promotional.',
    cards: [
      {
        icon: 'fas fa-screwdriver-wrench',
        title: 'Defect Coverage',
        body: 'Warranty is intended for hardware faults and manufacturing defects, not accidental damage or unauthorized modification.'
      },
      {
        icon: 'fas fa-magnifying-glass',
        title: 'Inspection First',
        body: 'Products may need assessment before a repair, replacement, or supplier escalation decision is made.'
      },
      {
        icon: 'fas fa-circle-exclamation',
        title: 'What Can Void Warranty',
        body: 'Liquid damage, tampering, broken seals where applicable, misuse, and unsupported repairs can void warranty handling.'
      }
    ],
    panels: [
      {
        title: 'Prepare before making a warranty claim',
        items: [
          'Keep proof of purchase and original packaging if possible.',
          'Record the symptoms clearly, including when the fault happens.',
          'Do not attempt risky self-repairs before contacting support.',
          'Bring accessories or power adapters if they could affect diagnosis.'
        ]
      },
      {
        title: 'Possible warranty outcomes',
        items: [
          'Repair where practical',
          'Replacement where stock allows',
          'Supplier/manufacturer escalation when needed',
          'Rejection of claim if inspection shows excluded damage or misuse'
        ]
      }
    ],
    faqs: [
      {
        question: 'Is every product covered by the same warranty length?',
        answer: 'No. Coverage length and terms can vary by category and supplier. Clarify before purchase if warranty duration is critical for the item.'
      },
      {
        question: 'Will data loss on electronics be covered?',
        answer: 'Warranty support is focused on hardware issues. Customers should back up data because service or replacement can require resets or part changes.'
      }
    ]
  }
};

function renderCustomerServicePage(pageKey) {
  return (req, res) => {
    const page = customerServicePages[pageKey];
    if (!page) return res.redirect('/');

    return res.render('layout', {
      title: page.title,
      content: 'pages/customer-service',
      currentSection: 'customer-service',
      servicePage: page
    });
  };
}

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

    const gallery = [];
    if (product.image_url) gallery.push(product.image_url);
    if (product.images) {
      let extras = product.images;
      if (typeof extras === 'string') {
        try {
          extras = JSON.parse(extras);
        } catch (e) {
          extras = [];
        }
      }
      if (Array.isArray(extras)) {
        extras.forEach((url) => {
          if (url && !gallery.includes(url)) gallery.push(url);
        });
      }
    }
    product.gallery_images = gallery.slice(0, 4);

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

router.get('/contact', renderCustomerServicePage('contact'));
router.get('/faq', renderCustomerServicePage('faq'));
router.get('/shipping', renderCustomerServicePage('shipping'));
router.get('/returns', renderCustomerServicePage('returns'));
router.get('/warranty', renderCustomerServicePage('warranty'));

module.exports = router;
