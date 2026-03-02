const mysql = require('mysql2');
require('dotenv').config();

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true' || String(value) === '1';
}

function buildConfigFromUrl(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username || ''),
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : '',
  };
}

const isProd = process.env.NODE_ENV === 'production';
const railwayUrl = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
const databaseUrl = process.env.DATABASE_URL || railwayUrl;

const useSsl = parseBool(
  process.env.DB_SSL,
  isProd && Boolean(railwayUrl)
);

let baseConfig;
if (databaseUrl) {
  baseConfig = buildConfigFromUrl(databaseUrl);
} else {
  baseConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '123456',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'gamelootmalawi'
  };
}

if (isProd) {
  const isDefaultUnsafeConfig =
    baseConfig.host === 'localhost' ||
    baseConfig.user === 'root' ||
    baseConfig.database === 'gamelootmalawi';
  if (isDefaultUnsafeConfig && !process.env.DATABASE_URL) {
    console.warn('[database] Production is using local/default DB settings. Set DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME.');
  }
}

const connection = mysql.createPool({
  ...baseConfig,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
  charset: 'utf8mb4',
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
});

module.exports = connection.promise();
