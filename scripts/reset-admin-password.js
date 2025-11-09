const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function reset(email, newPassword) {
  if (!email || !newPassword) {
    console.error('Usage: node reset-admin-password.js <email> <newPassword>');
    process.exit(1);
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const [result] = await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
    if (result.affectedRows === 0) {
      console.error('No user found with that email.');
      process.exit(1);
    }
    console.log(`Password for ${email} updated successfully.`);
    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  }
}

const [,, email, newPassword] = process.argv;
reset(email, newPassword);
