import { redis } from "./redis.js";

/**
 * Idempotency Control System backed by Redis.
 * Prevents double-submissions, duplicate registrations, and race conditions
 * on sensitive mutation endpoints (POST /api/events, POST /api/registrations, etc.).
 */

const DEFAULT_IDEMPOTENCY_TTL = 300; // 5 minutes

export async function checkIdempotency(key) {
  if (!key) return { isDuplicate: false };

  const fullKey = `idempotency:${key}`;
  const existing = await redis.get(fullKey);

  if (existing) {
    if (existing.status === "PROCESSING") {
      return { isDuplicate: true, status: "PROCESSING", error: "Request currently being processed. Please wait." };
    }
    if (existing.status === "COMPLETED") {
      return { isDuplicate: true, status: "COMPLETED", data: existing.data };
    }
  }

  // Mark request as PROCESSING
  await redis.set(fullKey, { status: "PROCESSING", createdAt: Date.now() }, DEFAULT_IDEMPOTENCY_TTL);
  return { isDuplicate: false };
}

export async function completeIdempotency(key, data = null, ttlSeconds = DEFAULT_IDEMPOTENCY_TTL) {
  if (!key) return;
  const fullKey = `idempotency:${key}`;
  await redis.set(fullKey, { status: "COMPLETED", data, completedAt: Date.now() }, ttlSeconds);
}

export async function releaseIdempotency(key) {
  if (!key) return;
  const fullKey = `idempotency:${key}`;
  await redis.del(fullKey);
}
