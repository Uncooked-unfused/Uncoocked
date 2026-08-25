import { redis } from "../../lib/redis.js";

// Centralized sliding window rate limiter for sensitive endpoints
export async function checkRateLimit(identifier, { limit = 20, windowMs = 60 * 1000 } = {}) {
  try {
    const res = await redis.rateLimit(identifier, { limit, windowMs });
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      resetMs: res.retryAfter * 1000,
    };
  } catch (err) {
    console.error(`⚠️ Sensitive endpoint rate limit check failed for "${identifier}":`, err.message);
    return { success: true, limit, remaining: limit - 1, resetMs: 0 };
  }
}
