const IORedis = require('ioredis');

function clean(value) {
  return String(value || '').trim();
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getRedisConfig() {
  const redisUrl = clean(process.env.REDIS_URL);
  if (redisUrl) {
    return {
      connection: {
        url: redisUrl,
        maxRetriesPerRequest: null
      },
      summary: { url: redisUrl }
    };
  }

  const host = clean(process.env.REDIS_HOST || '127.0.0.1');
  const port = parseNumber(process.env.REDIS_PORT, 6379);
  const db = parseNumber(process.env.REDIS_DB, 0);
  const username = clean(process.env.REDIS_USERNAME);
  const password = clean(process.env.REDIS_PASSWORD);

  const connection = {
    host,
    port,
    db,
    maxRetriesPerRequest: null
  };

  if (username) connection.username = username;
  if (password) connection.password = password;

  return {
    connection,
    summary: { host, port, db }
  };
}

function createRedisConnection() {
  const { connection } = getRedisConfig();
  if (connection.url) {
    const { url, ...options } = connection;
    return new IORedis(url, options);
  }
  return new IORedis(connection);
}

module.exports = {
  createRedisConnection,
  getRedisConfig
};
