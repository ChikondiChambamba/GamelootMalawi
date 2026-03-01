const db = require('../config/database');

class PaymentSettings {
  static async ensureTable() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id INT PRIMARY KEY DEFAULT 1,
        bank_account_name VARCHAR(255) NULL,
        bank_account_number VARCHAR(255) NULL,
        bank_name VARCHAR(255) NULL,
        mobile_money_provider VARCHAR(255) NULL,
        mobile_money_code VARCHAR(255) NULL,
        inquiry_phone VARCHAR(50) NULL,
        inquiry_email VARCHAR(255) NULL,
        notes TEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute('INSERT IGNORE INTO payment_settings (id) VALUES (1)');
  }

  static async get() {
    await this.ensureTable();
    const [rows] = await db.execute('SELECT * FROM payment_settings WHERE id = 1 LIMIT 1');
    return rows[0] || null;
  }

  static async update(data) {
    await this.ensureTable();
    const fields = [
      'bank_account_name',
      'bank_account_number',
      'bank_name',
      'mobile_money_provider',
      'mobile_money_code',
      'inquiry_phone',
      'inquiry_email',
      'notes'
    ];

    const values = fields.map((k) => data[k] || null);
    await db.execute(
      `UPDATE payment_settings
       SET bank_account_name = ?,
           bank_account_number = ?,
           bank_name = ?,
           mobile_money_provider = ?,
           mobile_money_code = ?,
           inquiry_phone = ?,
           inquiry_email = ?,
           notes = ?
       WHERE id = 1`,
      values
    );
    return this.get();
  }
}

module.exports = PaymentSettings;

