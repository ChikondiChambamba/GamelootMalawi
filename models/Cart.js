const db = require('../config/database');

class Cart {
  // Add item to cart
  static async addItem(userId, productId, quantity = 1) {
    try {
      const [result] = await db.execute(`
        INSERT INTO cart_items (user_id, product_id, quantity) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          quantity = quantity + ?,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, productId, quantity, quantity]);

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get all cart items for a user
  static async getCartItems(userId) {
    try {
      const [items] = await db.execute(`
        SELECT 
          ci.id,
          ci.user_id,
          ci.product_id,
          ci.quantity,
          p.id as product_id,
          p.name,
          p.price,
          p.image_url,
          p.stock_quantity,
          ci.created_at,
          ci.updated_at
        FROM cart_items ci
        INNER JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
        ORDER BY ci.updated_at DESC
      `, [userId]);

      return items || [];
    } catch (error) {
      throw error;
    }
  }

  // Update cart item quantity
  static async updateQuantity(userId, productId, quantity) {
    try {
      if (quantity <= 0) {
        // Delete if quantity is 0 or less
        return this.removeItem(userId, productId);
      }

      const [result] = await db.execute(`
        UPDATE cart_items 
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ? AND product_id = ?
      `, [quantity, userId, productId]);

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Remove item from cart
  static async removeItem(userId, productId) {
    try {
      const [result] = await db.execute(`
        DELETE FROM cart_items 
        WHERE user_id = ? AND product_id = ?
      `, [userId, productId]);

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Clear entire cart for user
  static async clearCart(userId) {
    try {
      const [result] = await db.execute(`
        DELETE FROM cart_items 
        WHERE user_id = ?
      `, [userId]);

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get cart count for user
  static async getCartCount(userId) {
    try {
      const [result] = await db.execute(`
        SELECT COUNT(*) as count FROM cart_items 
        WHERE user_id = ?
      `, [userId]);

      return result[0]?.count || 0;
    } catch (error) {
      throw error;
    }
  }

  // Get cart total for user
  static async getCartTotal(userId) {
    try {
      const [result] = await db.execute(`
        SELECT SUM(ci.quantity * p.price) as total
        FROM cart_items ci
        INNER JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `, [userId]);

      return result[0]?.total || 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Cart;
