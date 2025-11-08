const db = require('../config/database');

class Category {
  // Get all categories
  static async findAll() {
    const [categories] = await db.execute(`
      SELECT * FROM categories 
      WHERE is_active = TRUE 
      ORDER BY name
    `);
    return categories;
  }

  // Get category by ID
  static async findById(id) {
    const [categories] = await db.execute('SELECT * FROM categories WHERE id = ? AND is_active = TRUE', [id]);
    return categories[0] || null;
  }

  // Get category by slug
  static async findBySlug(slug) {
    const [categories] = await db.execute('SELECT * FROM categories WHERE slug = ? AND is_active = TRUE', [slug]);
    return categories[0] || null;
  }

  // Create new category
  static async create(categoryData) {
    const { name, description, icon, slug } = categoryData;
    
    const [result] = await db.execute(`
      INSERT INTO categories (name, description, icon, slug) 
      VALUES (?, ?, ?, ?)
    `, [name, description, icon, slug]);

    return this.findById(result.insertId);
  }

  // Update category
  static async update(id, categoryData) {
    const fields = [];
    const values = [];

    Object.keys(categoryData).forEach(key => {
      if (categoryData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(categoryData[key]);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await db.execute(`
      UPDATE categories 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, values);

    return this.findById(id);
  }

  // Delete category (soft delete)
  static async delete(id) {
    await db.execute('UPDATE categories SET is_active = FALSE WHERE id = ?', [id]);
    return true;
  }

  // Get category with products count
  static async findWithProductsCount() {
    const [categories] = await db.execute(`
      SELECT c.*, COUNT(p.id) as products_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE 
      WHERE c.is_active = TRUE 
      GROUP BY c.id 
      ORDER BY c.name
    `);
    return categories;
  }
}

module.exports = Category;