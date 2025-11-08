const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Find user by ID
  static async findById(id) {
    const [users] = await db.execute(
      'SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return users[0] || null;
  }

  // Find user by email
  static async findByEmail(email) {
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    return users[0] || null;
  }

  // Create new user
  static async create(userData) {
    const { name, email, password, phone, address } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(`
      INSERT INTO users (name, email, password, phone, address) 
      VALUES (?, ?, ?, ?, ?)
    `, [name, email, hashedPassword, phone, address]);

    return this.findById(result.insertId);
  }

  // Update user
  static async update(id, userData) {
    const fields = [];
    const values = [];

    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined && key !== 'password') {
        fields.push(`${key} = ?`);
        values.push(userData[key]);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await db.execute(`
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, values);

    return this.findById(id);
  }

  // Change password
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    return true;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;