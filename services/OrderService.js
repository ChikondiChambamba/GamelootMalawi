const db = require('../config/database');
const Order = require('../models/order');
const logger = require('../utils/logger');
const { enqueueOrderPostProcessingJob } = require('../queues/orderPostProcessingQueue');
const { runOrderPostProcessing } = require('../utils/orderPostProcessing');

class ServiceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
  }
}

class OrderService {
  static async createOrder({ user, items, shippingAddress, billingAddress, paymentMethod }) {
    if (!user || !user.id) {
      throw new ServiceError('Authenticated user is required', 401);
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new ServiceError('At least one item is required', 400);
    }

    const normalizedItems = await this.buildNormalizedItems(items);
    const totalAmount = normalizedItems.reduce((sum, item) => sum + item.total_price, 0);

    const orderData = {
      user_id: user.id,
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      billing_address: billingAddress || shippingAddress,
      customer_name: user.name,
      customer_email: user.email,
      customer_phone: user.phone,
      payment_method: paymentMethod
    };

    const orderId = await this.persistOrder(orderData, normalizedItems);
    const order = await Order.findById(orderId);

    if (!order) {
      throw new ServiceError('Order was created but could not be loaded', 500);
    }

    await this.queuePostProcessing({
      order,
      orderData,
      items: normalizedItems,
      totalAmount,
      shippingAddress: orderData.shipping_address,
      customerEmail: orderData.customer_email,
      paymentReceiptUrl: null,
      siteBaseUrl: process.env.APP_BASE_URL || '',
      receiptFile: null
    });

    return order;
  }

  static async buildNormalizedItems(items) {
    const requestedItems = items.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity)
    }));

    const invalidItem = requestedItems.find((item) => !Number.isInteger(item.product_id) || item.product_id <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0);
    if (invalidItem) {
      throw new ServiceError('Each order item must include a valid product_id and quantity', 400);
    }

    const productIds = [...new Set(requestedItems.map((item) => item.product_id))];
    const placeholders = productIds.map(() => '?').join(', ');
    const [products] = await db.execute(
      `SELECT id, name, price, image_url, stock_quantity
       FROM products
       WHERE is_active = TRUE AND id IN (${placeholders})`,
      productIds
    );

    const productMap = new Map((products || []).map((product) => [Number(product.id), product]));

    if (productMap.size !== productIds.length) {
      throw new ServiceError('One or more products could not be found', 404);
    }

    return requestedItems.map((item) => {
      const product = productMap.get(item.product_id);
      const availableStock = Number(product.stock_quantity || 0);
      if (item.quantity > availableStock) {
        throw new ServiceError(`Insufficient stock for ${product.name}`, 400);
      }

      const unitPrice = Number(product.price || 0);
      return {
        product_id: product.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * item.quantity,
        name: product.name,
        price: unitPrice,
        image_url: product.image_url
      };
    });
  }

  static async persistOrder(orderData, items) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const orderNumber = `GLM${Date.now()}`;
      let orderResult;

      try {
        const [resultWithNotes] = await connection.execute(`
          INSERT INTO orders (
            user_id, order_number, total_amount, shipping_address, billing_address,
            customer_name, customer_email, customer_phone, payment_method, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderData.user_id,
          orderNumber,
          orderData.total_amount,
          orderData.shipping_address,
          orderData.billing_address,
          orderData.customer_name,
          orderData.customer_email,
          orderData.customer_phone,
          orderData.payment_method,
          orderData.notes || null
        ]);
        orderResult = resultWithNotes;
      } catch (insertErr) {
        const message = String(insertErr && insertErr.message ? insertErr.message : '').toLowerCase();
        const unknownNotesColumn = message.includes('unknown column') && message.includes('notes');
        if (!unknownNotesColumn) throw insertErr;

        const [resultWithoutNotes] = await connection.execute(`
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
        orderResult = resultWithoutNotes;
      }

      const orderId = orderResult.insertId;

      for (const item of items) {
        await connection.execute(`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.unit_price, item.total_price]);
      }

      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async queuePostProcessing(payload) {
    try {
      await enqueueOrderPostProcessingJob(payload);
    } catch (queueErr) {
      logger.error('order_post_processing_enqueue_failed', {
        orderNumber: payload && payload.order ? payload.order.order_number || payload.order.id : null,
        error: queueErr && queueErr.message ? queueErr.message : String(queueErr)
      });

      setImmediate(() => {
        runOrderPostProcessing(payload).catch((err) => {
          logger.error('order_post_processing_fallback_failed', {
            orderNumber: payload && payload.order ? payload.order.order_number || payload.order.id : null,
            error: err && err.message ? err.message : String(err)
          });
        });
      });
    }
  }
}

module.exports = {
  OrderService,
  ServiceError
};
