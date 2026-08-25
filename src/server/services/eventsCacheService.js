import { redis } from "../../lib/redis.js";

const EVENT_LIST_TTL_SECONDS = 120; // 2 minutes
const EVENT_DETAIL_TTL_SECONDS = 300; // 5 minutes

/**
 * Event Caching & Invalidation Layer backed by Redis.
 * Implements Cache-Aside strategy with deterministic key namespacing.
 */

/**
 * Retrieve cached event listing by query key.
 */
export async function getCachedEvents(key) {
  try {
    return await redis.get(`events:list:${key}`);
  } catch (err) {
    console.error("⚠️ Error fetching cached events list:", err.message);
    return null;
  }
}

/**
 * Store event listing query results in Redis with TTL.
 */
export async function setCachedEvents(key, data) {
  try {
    await redis.set(`events:list:${key}`, data, EVENT_LIST_TTL_SECONDS);
  } catch (err) {
    console.error("⚠️ Error setting cached events list:", err.message);
  }
}

/**
 * Retrieve cached event detail by event ID.
 */
export async function getCachedEventDetail(eventId) {
  if (!eventId) return null;
  try {
    return await redis.get(`event:${eventId}`);
  } catch (err) {
    console.error(`⚠️ Error fetching cached event detail for "${eventId}":`, err.message);
    return null;
  }
}

/**
 * Store event detail in Redis with TTL.
 */
export async function setCachedEventDetail(eventId, data) {
  if (!eventId) return;
  try {
    await redis.set(`event:${eventId}`, data, EVENT_DETAIL_TTL_SECONDS);
  } catch (err) {
    console.error(`⚠️ Error setting cached event detail for "${eventId}":`, err.message);
  }
}

/**
 * Mandatory Cache Invalidation:
 * Executed after DB mutations (create, update, delete, moderate, archive).
 * Invalidates single event key and all event listing caches.
 */
export async function invalidateEventsCache(eventId = null) {
  try {
    if (eventId) {
      await redis.del(`event:${eventId}`);
    }
    await redis.delPattern(`events:list:*`);
  } catch (err) {
    // If cache invalidation fails, log error but DO NOT throw exception so DB mutation remains successful.
    console.error(`⚠️ Event cache invalidation failed for eventId "${eventId}":`, err.message);
  }
}
