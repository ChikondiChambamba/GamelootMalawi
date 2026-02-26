const db = require('../config/database');

class DealOption {
  static async ensureTable() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS deal_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('swap','rent','tournament') NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price_mwk DECIMAL(10,2) DEFAULT 0,
        location VARCHAR(255) NULL,
        starts_at DATETIME NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type_active (type, is_active)
      )
    `);
  }

  static async create(data) {
    await this.ensureTable();
    const {
      type,
      title,
      description = '',
      price_mwk = 0,
      location = null,
      starts_at = null
    } = data;

    const [result] = await db.execute(
      `INSERT INTO deal_options (type, title, description, price_mwk, location, starts_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [type, title, description, Number(price_mwk) || 0, location, starts_at]
    );
    return this.findById(result.insertId);
  }

  static async findById(id) {
    await this.ensureTable();
    const [rows] = await db.execute('SELECT * FROM deal_options WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async listByType(type, activeOnly = true) {
    await this.ensureTable();
    let sql = 'SELECT * FROM deal_options WHERE type = ?';
    const params = [type];
    if (activeOnly) sql += ' AND is_active = TRUE';
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.execute(sql, params);
    return rows || [];
  }

  static async listAll() {
    await this.ensureTable();
    const [rows] = await db.execute('SELECT * FROM deal_options ORDER BY type ASC, created_at DESC');
    return rows || [];
  }

  static async deactivate(id) {
    await this.ensureTable();
    await db.execute('UPDATE deal_options SET is_active = FALSE WHERE id = ?', [id]);
  }
}

module.exports = DealOption;

