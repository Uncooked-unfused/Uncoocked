import Redis from "ioredis";

/**
 * Centralized Redis Infrastructure Layer for UNCOOKED Application
 *
 * Provides a fault-tolerant, isolated, and observable Redis client abstraction.
 * If REDIS_URL is configured and accessible, uses ioredis.
 * If REDIS_URL is absent or Redis is temporarily unreachable, seamlessly falls
 * back to an in-memory storage engine to prevent application downtime.
 */

const NAMESPACE = "uncooked";
const DEFAULT_REDIS_URL = process.env.REDIS_URL;

let redisClient = null;
let isConnected = false;
let connectionAttempted = false;

// Observability metrics
const metrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  dels: 0,
  rateLimitBlocked: 0,
  errors: 0,
  fallbackOperations: 0,
};

// In-Memory Fallback Engine
const fallbackStore = new Map();
const fallbackTimers = new Map();
const fallbackRateLimits = new Map();
const fallbackQueues = new Map();

function getNamespacedKey(key) {
  if (key.startsWith(`${NAMESPACE}:`)) return key;
  return `${NAMESPACE}:${key}`;
}

function initRedisClient() {
  if (connectionAttempted) return redisClient;
  connectionAttempted = true;

  if (!DEFAULT_REDIS_URL) {
    console.warn("⚠️ REDIS_URL environment variable is missing. Operating in resilient fallback mode (In-Memory).");
    return null;
  }

  try {
    redisClient = new Redis(DEFAULT_REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 5) {
          console.warn("⚠️ Redis reconnect retries exceeded limit. Using in-memory fallback.");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on("connect", () => {
      isConnected = true;
      console.log("⚡ [Redis] Successfully connected to Redis infrastructure server.");
    });

    redisClient.on("error", (err) => {
      isConnected = false;
      metrics.errors++;
      console.error("⚠️ [Redis Error]:", err.message || err);
    });

    redisClient.on("close", () => {
      isConnected = false;
    });
  } catch (err) {
    console.error("⚠️ Failed to initialize Redis client:", err.message);
    redisClient = null;
    isConnected = false;
  }

  return redisClient;
}

// Ensure client initialization attempt on module load
initRedisClient();

export const redis = {
  /**
   * Check whether Redis connection is alive and healthy.
   */
  isRedisConnected() {
    return isConnected && redisClient && redisClient.status === "ready";
  },

  /**
   * Retrieve observability metrics.
   */
  getMetrics() {
    return { ...metrics, connected: this.isRedisConnected() };
  },

  /**
   * Get value by key.
   */
  async get(key) {
    const fullKey = getNamespacedKey(key);
    if (this.isRedisConnected()) {
      try {
        const raw = await redisClient.get(fullKey);
        if (raw !== null) {
          metrics.hits++;
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        }
        metrics.misses++;
        return null;
      } catch (err) {
        metrics.errors++;
        metrics.fallbackOperations++;
        console.warn(`⚠️ [Redis GET Fallback] for key "${fullKey}": ${err.message}`);
      }
    }

    // Fallback Store read
    metrics.fallbackOperations++;
    const entry = fallbackStore.get(fullKey);
    if (!entry) {
      metrics.misses++;
      return null;
    }
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      fallbackStore.delete(fullKey);
      metrics.misses++;
      return null;
    }
    metrics.hits++;
    return entry.value;
  },

  /**
   * Set key with optional TTL in seconds.
   */
  async set(key, value, ttlSeconds = null) {
    const fullKey = getNamespacedKey(key);
    metrics.sets++;
    const serialized = typeof value === "string" ? value : JSON.stringify(value);

    if (this.isRedisConnected()) {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await redisClient.set(fullKey, serialized, "EX", ttlSeconds);
        } else {
          await redisClient.set(fullKey, serialized);
        }
        return true;
      } catch (err) {
        metrics.errors++;
        metrics.fallbackOperations++;
        console.warn(`⚠️ [Redis SET Fallback] for key "${fullKey}": ${err.message}`);
      }
    }

    // Fallback Store write
    metrics.fallbackOperations++;
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    fallbackStore.set(fullKey, { value, expiresAt });

    if (fallbackTimers.has(fullKey)) {
      clearTimeout(fallbackTimers.get(fullKey));
      fallbackTimers.delete(fullKey);
    }

    if (expiresAt) {
      const timer = setTimeout(() => {
        fallbackStore.delete(fullKey);
        fallbackTimers.delete(fullKey);
      }, ttlSeconds * 1000);
      if (timer.unref) timer.unref();
      fallbackTimers.set(fullKey, timer);
    }
    return true;
  },

  /**
   * Delete key(s).
   */
  async del(key) {
    const fullKey = getNamespacedKey(key);
    metrics.dels++;

    if (this.isRedisConnected()) {
      try {
        await redisClient.del(fullKey);
      } catch (err) {
        metrics.errors++;
        metrics.fallbackOperations++;
        console.warn(`⚠️ [Redis DEL Fallback] for key "${fullKey}": ${err.message}`);
      }
    }

    // Always clear fallback store as well
    fallbackStore.delete(fullKey);
    if (fallbackTimers.has(fullKey)) {
      clearTimeout(fallbackTimers.get(fullKey));
      fallbackTimers.delete(fullKey);
    }
    return true;
  },

  /**
   * Delete keys matching a pattern (e.g. "uncooked:events:list:*").
   */
  async delPattern(pattern) {
    const fullPattern = getNamespacedKey(pattern);
    metrics.dels++;

    if (this.isRedisConnected()) {
      try {
        const stream = redisClient.scanStream({ match: fullPattern, count: 100 });
        const keysToDelete = [];
        await new Promise((resolve, reject) => {
          stream.on("data", (resultKeys) => {
            keysToDelete.push(...resultKeys);
          });
          stream.on("end", resolve);
          stream.on("error", reject);
        });

        if (keysToDelete.length > 0) {
          await redisClient.del(...keysToDelete);
        }
      } catch (err) {
        metrics.errors++;
        metrics.fallbackOperations++;
        console.warn(`⚠️ [Redis DEL Pattern Fallback] pattern "${fullPattern}": ${err.message}`);
      }
    }

    // Fallback store regex deletion
    const regexPattern = new RegExp("^" + fullPattern.replace(/\*/g, ".*") + "$");
    for (const key of fallbackStore.keys()) {
      if (regexPattern.test(key)) {
        fallbackStore.delete(key);
        if (fallbackTimers.has(key)) {
          clearTimeout(fallbackTimers.get(key));
          fallbackTimers.delete(key);
        }
      }
    }
    return true;
  },

  /**
   * Check if key exists.
   */
  async exists(key) {
    const fullKey = getNamespacedKey(key);
    if (this.isRedisConnected()) {
      try {
        const count = await redisClient.exists(fullKey);
        return count > 0;
      } catch (err) {
        metrics.errors++;
        metrics.fallbackOperations++;
      }
    }

    const entry = fallbackStore.get(fullKey);
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      fallbackStore.delete(fullKey);
      return false;
    }
    return true;
  },

  /**
   * Increment counter key.
   */
  async incr(key) {
    const fullKey = getNamespacedKey(key);
    if (this.isRedisConnected()) {
      try {
        return await redisClient.incr(fullKey);
      } catch (err) {
        metrics.errors++;
        metrics.fallbackOperations++;
      }
    }

    const current = (await this.get(key)) || 0;
    const nextVal = (typeof current === "number" ? current : parseInt(current, 10) || 0) + 1;
    await this.set(key, nextVal);
    return nextVal;
  },

  /**
   * Set expiration in seconds on key.
   */
  async expire(key, ttlSeconds) {
    const fullKey = getNamespacedKey(key);
    if (this.isRedisConnected()) {
      try {
        await redisClient.expire(fullKey, ttlSeconds);
        return true;
      } catch (err) {
        metrics.errors++;
        metrics.fallbackOperations++;
      }
    }

    const entry = fallbackStore.get(fullKey);
    if (entry) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
    }
    return true;
  },

  /**
   * Sliding-Window Rate Limiter
   * Returns: { success: boolean, limit: number, remaining: number, retryAfter: number }
   */
  async rateLimit(key, { limit = 20, windowMs = 60 * 1000 } = {}) {
    const fullKey = getNamespacedKey(`rate-limit:${key}`);
    const now = Date.now();
    const windowSec = Math.ceil(windowMs / 1000);

    if (this.isRedisConnected()) {
      try {
        // Atomic sliding window using Redis Multi/Pipeline
        const clearBefore = now - windowMs;
        const results = await redisClient
          .pipeline()
          .zremrangebyscore(fullKey, 0, clearBefore)
          .zadd(fullKey, now, `${now}-${Math.random()}`)
          .zcard(fullKey)
          .expire(fullKey, windowSec)
          .exec();

        const count = results[2][1] || 0;
        if (count > limit) {
          metrics.rateLimitBlocked++;
          const oldest = await redisClient.zrange(fullKey, 0, 0, "WITHSCORES");
          const oldestTime = oldest.length >= 2 ? parseInt(oldest[1], 10) : now;
          const retryAfter = Math.max(1, Math.ceil((oldestTime + windowMs - now) / 1000));
          return { success: false, limit, remaining: 0, retryAfter };
        }

        return { success: true, limit, remaining: Math.max(0, limit - count), retryAfter: 0 };
      } catch (err) {
        metrics.errors++;
        metrics.fallbackOperations++;
        console.warn(`⚠️ [Redis Rate Limit Fallback] for key "${fullKey}": ${err.message}`);
      }
    }

    // In-Memory Sliding Window Fallback
    metrics.fallbackOperations++;
    const timestamps = fallbackRateLimits.get(fullKey) || [];
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= limit) {
      metrics.rateLimitBlocked++;
      const oldestTime = validTimestamps[0];
      const retryAfter = Math.max(1, Math.ceil((oldestTime + windowMs - now) / 1000));
      return { success: false, limit, remaining: 0, retryAfter };
    }

    validTimestamps.push(now);
    fallbackRateLimits.set(fullKey, validTimestamps);
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - validTimestamps.length),
      retryAfter: 0,
    };
  },

  /**
   * Enqueue job to background Redis list queue.
   */
  async enqueueJob(queueName, jobData) {
    const fullKey = getNamespacedKey(`queue:${queueName}`);
    const payload = JSON.stringify({ id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, data: jobData, enqueuedAt: Date.now() });

    if (this.isRedisConnected()) {
      try {
        await redisClient.lpush(fullKey, payload);
        return true;
      } catch (err) {
        metrics.errors++;
        metrics.fallbackOperations++;
      }
    }

    if (!fallbackQueues.has(fullKey)) {
      fallbackQueues.set(fullKey, []);
    }
    fallbackQueues.get(fullKey).push(payload);
    return true;
  },

  /**
   * Dequeue job from background Redis list queue.
   */
  async dequeueJob(queueName) {
    const fullKey = getNamespacedKey(`queue:${queueName}`);

    if (this.isRedisConnected()) {
      try {
        const raw = await redisClient.rpop(fullKey);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        metrics.errors++;
        metrics.fallbackOperations++;
      }
    }

    const queue = fallbackQueues.get(fullKey);
    if (!queue || queue.length === 0) return null;
    const raw = queue.pop();
    return raw ? JSON.parse(raw) : null;
  },

  /**
   * Flush development Redis cache keys in uncooked namespace.
   */
  async flushNamespace() {
    await this.delPattern("*");
    fallbackStore.clear();
    fallbackTimers.forEach((timer) => clearTimeout(timer));
    fallbackTimers.clear();
    fallbackRateLimits.clear();
    fallbackQueues.clear();
    return true;
  },
};
