const express = require('express');
const rateLimit = require('express-rate-limit');
const RewardCoupon = require('../../models/RewardCoupon');

const router = express.Router();

const catchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Slow down and try again.' }
});

router.get('/rewards/status', async (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, requireLogin: true, message: 'Please login to track rewards.' });
  }

  try {
    const progress = await RewardCoupon.getProgress(req.session.user.id);
    return res.json({ success: true, progress });
  } catch (err) {
    console.error('Rewards status error:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch rewards status.' });
  }
});

router.post('/rewards/catch', catchLimiter, async (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, requireLogin: true, message: 'Login required to claim coupons.' });
  }

  try {
    const result = await RewardCoupon.claimCoupon(req.session.user.id);
    if (!result.ok) {
      if (result.reason === 'cooldown') {
        return res.json({
          success: false,
          cooldown: true,
          retryAfterMs: result.retryAfterMs,
          progress: result.progress,
          message: 'Too fast. Try catching it again in a few seconds.'
        });
      }
      if (result.reason === 'completed') {
        return res.json({
          success: true,
          completed: true,
          progress: result.progress,
          message: 'You already reached 100 coupons (MWK 100,000 total). Claim your reward product from admin.'
        });
      }
    }

    return res.json({
      success: true,
      completed: result.completed,
      progress: result.progress,
      message: result.completed
        ? 'Jackpot! 100 coupons reached (MWK 100,000 total). You won a MWK 100,000 reward product.'
        : `Coupon captured! ${result.progress.coupons}/100 collected.`
    });
  } catch (err) {
    console.error('Rewards catch error:', err);
    return res.status(500).json({ success: false, message: 'Could not claim coupon.' });
  }
});

module.exports = router;

