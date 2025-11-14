const db = require('../config/database');

class Wishlist {
  static async add(userId, productId) {
    try {
      const [result] = await db.execute(
        'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP',
        [userId, productId]
      );
      return result;
    } catch (err) {
      throw err;
    }
  }

  static async remove(userId, productId) {
    try {
      const [result] = await db.execute(
        'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );
      return result;
    } catch (err) {
      throw err;
    }
  }

  static async toggle(userId, productId) {
    try {
      // Check if exists
      const [rows] = await db.execute('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
      if (rows && rows.length > 0) {
        await this.remove(userId, productId);
        return { added: false };
      } else {
        await this.add(userId, productId);
        return { added: true };
      }
    } catch (err) {
      throw err;
    }
  }

  static async getForUser(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT p.* FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?`,
        [userId]
      );
      return rows || [];
    } catch (err) {
      throw err;
    }
  }
}

module.exports = Wishlist;
