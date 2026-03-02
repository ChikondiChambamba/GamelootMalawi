require('dotenv').config();
const db = require('../config/database');

async function run() {
  try {
    const [rows] = await db.execute('SELECT 1 AS ok');
    console.log('DB connection OK:', rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('DB connection failed:', {
      code: error && error.code,
      errno: error && error.errno,
      message: error && error.message
    });
    process.exit(1);
  }
}

run();
