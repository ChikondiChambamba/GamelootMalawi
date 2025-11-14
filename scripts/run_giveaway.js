// Simple script to run giveaways for active promotions
const db = require('../config/database');
const Promotion = require('../models/Promotion');

(async function run() {
  try {
    const promotion = await Promotion.getActivePromotion();
    if (!promotion) {
      console.log('No active promotion found');
      process.exit(0);
    }

    // Run giveaway for 1 winner by default
    const winners = await Promotion.runGiveaway(promotion.id, 1);
    console.log('Winners:', winners);
    process.exit(0);
  } catch (err) {
    console.error('Giveaway error:', err);
    process.exit(1);
  }
})();
