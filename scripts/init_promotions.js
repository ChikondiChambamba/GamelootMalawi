// Script to ensure promotions tables exist. Run with: node scripts/init_promotions.js
const db = require('../config/database');

async function run() {
  try {
    const createPromotions = `
CREATE TABLE IF NOT EXISTS promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  giveaway_interval_months INT DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

    const createWinners = `
CREATE TABLE IF NOT EXISTS promotion_winners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  promotion_id INT NOT NULL,
  user_id INT NOT NULL,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

    console.log('Creating promotions table (if not exists)...');
    await db.execute(createPromotions);
    console.log('Creating promotion_winners table (if not exists)...');
    await db.execute(createWinners);
    // If promotions table is empty, insert a sample promotion so Deals page shows something
    const [rows] = await db.execute('SELECT COUNT(*) as cnt FROM promotions');
    const count = rows && rows[0] ? rows[0].cnt : 0;
    if (count === 0) {
      console.log('Seeding sample promotion...');
      await db.execute(
        `INSERT INTO promotions (title, description, start_date, giveaway_interval_months, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        ['Quarterly Giveaway', 'Win a free console every quarter! Sign up and stay tuned.', new Date().toISOString().slice(0,10), 3, 1]
      );
    }
    // Create wishlist table if not exists
    const createWishlist = `
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    console.log('Creating wishlist table (if not exists)...');
    await db.execute(createWishlist);
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to initialize promotions tables:', err);
    process.exit(1);
  }
}

run();
