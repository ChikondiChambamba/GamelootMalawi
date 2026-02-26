const express = require('express');
const DealOption = require('../../models/DealOption');
const { isAdmin } = require('../../middleware/auth2');

const router = express.Router();

const LABELS = {
  swap: 'Swap Games',
  rent: 'Rentals',
  tournament: 'Tournaments'
};

router.get('/deals/:type', async (req, res) => {
  const rawType = req.params.type;
  const type = rawType === 'tournaments' ? 'tournament' : rawType;
  if (!LABELS[type]) {
    req.flash('error', 'Invalid deals category');
    return res.redirect('/shop?category=deals');
  }

  try {
    const items = await DealOption.listByType(type, true);
    return res.render('layout', {
      title: `${LABELS[type]} - Deals`,
      content: 'pages/deals-options',
      dealType: type,
      dealTitle: LABELS[type],
      deals: items
    });
  } catch (err) {
    console.error('Deals listing error:', err);
    req.flash('error', 'Could not load deals options');
    return res.redirect('/shop?category=deals');
  }
});

router.get('/admin/deals', isAdmin, async (req, res) => {
  try {
    const items = await DealOption.listAll();
    return res.render('layout', {
      title: 'Deals Management - Admin',
      content: 'pages/admin-deals',
      dealItems: items,
      success: req.flash('success'),
      error: req.flash('error'),
      currentUser: req.session.user
    });
  } catch (err) {
    console.error('Admin deals page error:', err);
    req.flash('error', 'Could not load deals management');
    return res.redirect('/admin');
  }
});

router.post('/admin/deals', isAdmin, async (req, res) => {
  const { type, title, description, price_mwk, location, starts_at } = req.body;
  if (!LABELS[type] || !title) {
    req.flash('error', 'Type and title are required');
    return res.redirect('/admin/deals');
  }

  try {
    await DealOption.create({ type, title, description, price_mwk, location, starts_at: starts_at || null });
    req.flash('success', 'Deals option added');
    return res.redirect('/admin/deals');
  } catch (err) {
    console.error('Add deals option error:', err);
    req.flash('error', 'Could not add deals option');
    return res.redirect('/admin/deals');
  }
});

router.post('/admin/deals/:id/delete', isAdmin, async (req, res) => {
  try {
    await DealOption.deactivate(req.params.id);
    req.flash('success', 'Deals option removed');
    return res.redirect('/admin/deals');
  } catch (err) {
    console.error('Delete deals option error:', err);
    req.flash('error', 'Could not remove deals option');
    return res.redirect('/admin/deals');
  }
});

module.exports = router;
