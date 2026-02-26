const db = require('../config/database');

class Order {
  // Create new order
  static async create(orderData, items) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Generate order number
      const orderNumber = 'GLM' + Date.now();

      // Insert order
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (
          user_id, order_number, total_amount, shipping_address, billing_address,
          customer_name, customer_email, customer_phone, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderData.user_id,
        orderNumber,
        orderData.total_amount,
        orderData.shipping_address,
        orderData.billing_address,
        orderData.customer_name,
        orderData.customer_email,
        orderData.customer_phone,
        orderData.payment_method
      ]);

      const orderId = orderResult.insertId;

      // Insert order items
      for (const item of items) {
        await connection.execute(`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.unit_price, item.total_price]);
      }

      await connection.commit();

      return this.findById(orderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Find order by ID
  static async findById(id) {
    const [orders] = await db.execute(`
      SELECT o.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'product_name', p.name,
                 'product_image', p.image_url,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'total_price', oi.total_price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ?
      GROUP BY o.id
    `, [id]);

    if (orders.length === 0) return null;

    const order = orders[0];
    order.items = JSON.parse(order.items).filter(item => item.product_id !== null);
    return order;
  }

  // Find orders by user ID
  static async findByUserId(userId, { page = 1, limit = 10 } = {}) {
    // Coerce numeric inputs and inline them into the query to avoid
    // drivers that don't accept placeholders for LIMIT/OFFSET.
    const pageNum = Number.isFinite(Number(page)) ? parseInt(page, 10) : 1;
    const lim = Number.isFinite(Number(limit)) ? parseInt(limit, 10) : 10;
    const offset = Math.max(0, (pageNum - 1) * lim);

    const sql = `
      SELECT o.*, COALESCE(COUNT(oi.id),0) AS items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${Number(lim)} OFFSET ${Number(offset)}
    `;

    const [orders] = await db.execute(sql, [userId]);
    return orders;
  }

  // Update order status
  static async updateStatus(id, status) {
    await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  // Get all orders (admin)
  static async findAll({ page = 1, limit = 10, status = null } = {}) {
    
    let query = 'SELECT o.* FROM orders o WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    // Coerce numeric values and inline them to avoid binding issues
    const lim = Number.isFinite(Number(limit)) ? parseInt(limit, 10) : 10;
    const pageNum = Number.isFinite(Number(page)) ? parseInt(page, 10) : 1;
    const offset = Math.max(0, (pageNum - 1) * lim);

    query += ` ORDER BY o.created_at DESC LIMIT ${Number(lim)} OFFSET ${Number(offset)}`;

    const [orders] = await db.execute(query, params);
    return orders;
  }
}

module.exports = Order;
