let Redis;
try {
  Redis = require('ioredis');
} catch {
  Redis = null;
}

/**
 * Redis session store with in-memory fallback.
 * Allows the module to work without Redis installed.
 */

const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds

let redisClient = null;
const memoryStore = new Map();

function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url || !Redis) {
    console.warn('⚠️  Redis not configured — using in-memory session store');
    return;
  }
  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
    });
    redisClient.on('connect', () => console.log('🔴 Redis connected'));
    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
      redisClient = null;
    });
  } catch {
    console.warn('⚠️  Redis init failed — using in-memory fallback');
  }
}

async function setSession(sessionId, data, ttl = SESSION_TTL) {
  const payload = JSON.stringify(data);
  if (redisClient) {
    await redisClient.set(`chat:session:${sessionId}`, payload, 'EX', ttl);
  } else {
    memoryStore.set(sessionId, { data, expiresAt: Date.now() + ttl * 1000 });
  }
}

async function getSession(sessionId) {
  if (redisClient) {
    const raw = await redisClient.get(`chat:session:${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  }
  const entry = memoryStore.get(sessionId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(sessionId);
    return null;
  }
  return entry.data;
}

async function deleteSession(sessionId) {
  if (redisClient) {
    await redisClient.del(`chat:session:${sessionId}`);
  } else {
    memoryStore.delete(sessionId);
  }
}

module.exports = { initRedis, setSession, getSession, deleteSession };
