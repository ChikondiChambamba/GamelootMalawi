const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static isMissingColumnError(error) {
    return error && (error.code === 'ER_BAD_FIELD_ERROR' || error.code === 'ER_NO_SUCH_TABLE');
  }

  // Find user by ID
  static async findById(id) {
    try {
      const [users] = await db.execute(
        'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
        [id]
      );
      return users[0] || null;
    } catch (error) {
      if (!this.isMissingColumnError(error)) throw error;
      const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      return users[0] || null;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const [users] = await db.execute(
        'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
        [email]
      );
      return users[0] || null;
    } catch (error) {
      if (!this.isMissingColumnError(error)) throw error;
      const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      return users[0] || null;
    }
  }

  // Create new user
  static async create(userData) {
    const { name, email, password, phone, address, role = 'customer' } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let result;
    try {
      [result] = await db.execute(
        'INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, phone || '', address || '', role]
      );
    } catch (error) {
      if (!this.isMissingColumnError(error)) throw error;
      try {
        [result] = await db.execute(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [name, email, hashedPassword, role]
        );
      } catch (fallbackError) {
        if (!this.isMissingColumnError(fallbackError)) throw fallbackError;
        [result] = await db.execute(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          [name, email, hashedPassword]
        );
      }
    }

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

    try {
      await db.execute(`
        UPDATE users
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, values);
    } catch (error) {
      if (!this.isMissingColumnError(error)) throw error;
      const allowedFallbackFields = fields
        .map((field) => field.split('=')[0].trim())
        .filter((field) => ['name', 'email', 'password'].includes(field));
      if (!allowedFallbackFields.length) return this.findById(id);

      const fallbackValues = [];
      const fallbackSets = [];
      allowedFallbackFields.forEach((field) => {
        fallbackSets.push(`${field} = ?`);
        fallbackValues.push(userData[field]);
      });
      fallbackValues.push(id);
      await db.execute(`UPDATE users SET ${fallbackSets.join(', ')} WHERE id = ?`, fallbackValues);
    }

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
