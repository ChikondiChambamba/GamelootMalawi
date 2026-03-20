const db = require('../config/database');

class PriceCalculatorSettings {
  static get defaults() {
    return {
      price_per_weight_kg: 52500,
      fixed_tax: 36000
    };
  }

  static async ensureTable() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS price_calculator_settings (
        id INT PRIMARY KEY DEFAULT 1,
        price_per_weight_kg DECIMAL(12, 2) NOT NULL DEFAULT 52500.00,
        fixed_tax DECIMAL(12, 2) NOT NULL DEFAULT 36000.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(
      `INSERT IGNORE INTO price_calculator_settings (id, price_per_weight_kg, fixed_tax)
       VALUES (1, ?, ?)`,
      [this.defaults.price_per_weight_kg, this.defaults.fixed_tax]
    );
  }

  static async get() {
    await this.ensureTable();
    const [rows] = await db.execute(
      'SELECT * FROM price_calculator_settings WHERE id = 1 LIMIT 1'
    );
    return rows[0] || { id: 1, ...this.defaults };
  }

  static async update(data) {
    await this.ensureTable();

    const pricePerWeight = Number.parseFloat(data.price_per_weight_kg);
    const fixedTax = Number.parseFloat(data.fixed_tax);

    await db.execute(
      `UPDATE price_calculator_settings
       SET price_per_weight_kg = ?,
           fixed_tax = ?
       WHERE id = 1`,
      [
        Number.isFinite(pricePerWeight) ? pricePerWeight : this.defaults.price_per_weight_kg,
        Number.isFinite(fixedTax) ? fixedTax : this.defaults.fixed_tax
      ]
    );

    return this.get();
  }
}

module.exports = PriceCalculatorSettings;
