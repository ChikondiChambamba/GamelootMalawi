const db = require('../config/database');

class Product {
  // Get all products with pagination and filtering
  static async findAll({ page = 1, limit = 10, category = null, search = null, featured = null } = {}) {
  // coerce and guard numeric inputs
  page = Number.isFinite(Number(page)) ? parseInt(page, 10) : 1;
  page = page > 0 ? page : 1;
  limit = Number.isFinite(Number(limit)) ? parseInt(limit, 10) : 10;
  limit = limit > 0 ? limit : 10;
  const offset = Math.max(0, (page - 1) * limit);

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

    if (featured !== null && featured !== undefined) {
      // normalize featured to 0/1
      const f = (featured === true || featured === 1 || featured === '1' || featured === 'true') ? 1 : 0;
      query += ' AND p.is_featured = ?';
      params.push(f);
    }

  // Append ORDER/LIMIT/OFFSET directly because some MySQL drivers don't accept
  // parameter placeholders for LIMIT/OFFSET. `limit` and `offset` are already
  // validated and coerced to positive integers above.
  query += ' ORDER BY p.created_at DESC LIMIT ' + Number(limit) + ' OFFSET ' + Number(offset);

    let products;
    try {
      const result = await db.execute(query, params);
      products = result[0];
    } catch (err) {
      // Enhanced debug information to help diagnose mysqld_stmt_execute errors
      console.error('Product.findAll SQL error. Query:', query);
      console.error('Product.findAll params:', params);
      console.error('Product.findAll param types:', params.map(p => typeof p));
      throw err;
    }

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
  const total = countResult[0] ? countResult[0].total : 0;

    return {
      products,
      pagination: {
        page: page,
        limit: limit,
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
    limit = Number(limit) || 6;
    const sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_featured = TRUE AND p.is_active = TRUE 
      ORDER BY p.created_at DESC 
      LIMIT ${limit}
    `;

    const [products] = await db.execute(sql);

    return products;
  }

  // Lightweight findAll using simple limit/offset (useful for admin lists)
  static async findAllSimple(limit = 100, offset = 0) {
    limit = Number(limit) || 100;
    offset = Number(offset) || 0;

    // Some MySQL drivers/databases don't accept parameter placeholders for LIMIT/OFFSET
    // so we inline the validated numeric values directly into the query string.
    const sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
      ORDER BY p.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    try {
      const [rows] = await db.execute(sql);
      return rows;
    } catch (error) {
      console.error('Product.findAllSimple SQL error. Query:', sql);
      console.error('Product.findAllSimple params:', { limit, offset });
      throw error;
    }
  }

  // Get products by category
  static async findByCategory(categorySlug, { page = 1, limit = 10 } = {}) {
    page = Number(page) || 1;
    limit = Number(limit) || 10;
    const offset = Math.max(0, (page - 1) * limit);

    const sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE c.slug = ? AND p.is_active = TRUE 
      ORDER BY p.created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [products] = await db.execute(sql, [categorySlug]);

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

    const sql = `
      UPDATE products
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      console.log('Product.update SQL:', sql);
      console.log('Product.update values:', values);
      await db.execute(sql, values);
    } catch (err) {
      console.error('Product.update SQL error:', err);
      console.error('Product.update SQL:', sql);
      console.error('Product.update values:', values);
      throw err;
    }

    return this.findById(id);
  }

  // Delete product (soft delete)
  static async delete(id) {
    await db.execute('UPDATE products SET is_active = FALSE WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Product;