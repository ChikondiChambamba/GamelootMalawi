const db = require('../config/database');

class Product {
  // Get all products with pagination and filtering
  static async findAll({ page = 1, limit = 10, category = null, search = null, featured = null }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = TRUE
    `;
    const params = [];

    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (featured !== null) {
      query += ' AND p.is_featured = ?';
      params.push(featured);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [products] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = TRUE';
    const countParams = [];
    
    if (category) {
      countQuery += ' AND c.slug = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get product by ID
  static async findById(id) {
    const [products] = await db.execute(`
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ? AND p.is_active = TRUE
    `, [id]);

    return products[0] || null;
  }

  // Get featured products
  static async findFeatured(limit = 6) {
    const [products] = await db.execute(`
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_featured = TRUE AND p.is_active = TRUE 
      ORDER BY p.created_at DESC 
      LIMIT ?
    `, [limit]);

    return products;
  }

  // Get products by category
  static async findByCategory(categorySlug, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    
    const [products] = await db.execute(`
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE c.slug = ? AND p.is_active = TRUE 
      ORDER BY p.created_at DESC 
      LIMIT ? OFFSET ?
    `, [categorySlug, limit, offset]);

    return products;
  }

  // Create new product
  static async create(productData) {
    const {
      name, description, short_description, price, original_price,
      category_id, image_url, images, specifications, stock_quantity,
      sku, badge, is_featured
    } = productData;

    const [result] = await db.execute(`
      INSERT INTO products (
        name, description, short_description, price, original_price,
        category_id, image_url, images, specifications, stock_quantity,
        sku, badge, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, description, short_description, price, original_price,
      category_id, image_url, JSON.stringify(images), JSON.stringify(specifications), stock_quantity,
      sku, badge, is_featured
    ]);

    return this.findById(result.insertId);
  }

  // Update product
  static async update(id, productData) {
    const fields = [];
    const values = [];

    Object.keys(productData).forEach(key => {
      if (productData[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'images' || key === 'specifications') {
          values.push(JSON.stringify(productData[key]));
        } else {
          values.push(productData[key]);
        }
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await db.execute(`
      UPDATE products 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, values);

    return this.findById(id);
  }

  // Delete product (soft delete)
  static async delete(id) {
    await db.execute('UPDATE products SET is_active = FALSE WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Product;