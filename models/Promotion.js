const db = require('../config/database');

class Promotion {
  static async getActivePromotion() {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM promotions WHERE is_active = TRUE ORDER BY start_date DESC LIMIT 1'
      );
      return rows[0] || null;
    } catch (err) {
      // If table doesn't exist, log and return null so app continues to function
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('Promotions table missing:', err.sqlMessage || err.message);
        return null;
      }
      throw err;
    }
  }

  static async getPromotionById(id) {
    const [rows] = await db.execute('SELECT * FROM promotions WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async getWinners(promotionId) {
    try {
      const [rows] = await db.execute(
        `SELECT pw.*, u.name, u.email
         FROM promotion_winners pw
         JOIN users u ON pw.user_id = u.id
         WHERE pw.promotion_id = ?
         ORDER BY pw.awarded_at DESC`,
        [promotionId]
      );
      return rows || [];
    } catch (err) {
      if (err && err.code === 'ER_NO_SUCH_TABLE') {
        console.warn('Promotion winners table missing:', err.sqlMessage || err.message);
        return [];
      }
      throw err;
    }
  }

  // Picks 'count' random eligible users and records them as winners
  static async runGiveaway(promotionId, count = 1) {
    // Select eligible users (active customers)
    const [users] = await db.execute('SELECT id FROM users WHERE is_active = TRUE');
    if (!users || users.length === 0) return [];

    // If count >= users.length, award all
    const maxCount = Math.min(count, users.length);

    // Pick random users using ORDER BY RAND() for simplicity (server-side)
    const [selected] = await db.execute(
      `SELECT id FROM users WHERE is_active = TRUE ORDER BY RAND() LIMIT ?`,
      [maxCount]
    );

    if (!selected || selected.length === 0) return [];

    // Insert winners
    const inserts = selected.map(u => [promotionId, u.id]);
    await db.query(
      'INSERT INTO promotion_winners (promotion_id, user_id) VALUES ?',
      [inserts]
    );

    // Return winners with user info
    const [winners] = await db.execute(
      `SELECT pw.*, u.name, u.email
       FROM promotion_winners pw
       JOIN users u ON pw.user_id = u.id
       WHERE pw.promotion_id = ?
       ORDER BY pw.awarded_at DESC
       LIMIT ?`,
      [promotionId, maxCount]
    );

    return winners || [];
  }

  static async createPromotion(data) {
    const { title, description, start_date = null, end_date = null, giveaway_interval_months = 3, is_active = true } = data;
    const [result] = await db.execute(
      `INSERT INTO promotions (title, description, start_date, end_date, giveaway_interval_months, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, start_date, end_date, giveaway_interval_months, is_active]
    );
    return this.getPromotionById(result.insertId);
  }
}

module.exports = Promotion;
