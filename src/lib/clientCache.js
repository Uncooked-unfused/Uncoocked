// In-memory client-side cache for instant admin navigation (stale-while-revalidate pattern)
const clientCache = new Map();

/**
 * Synchronously retrieves cached data for initial component state rendering.
 * Enables 0ms immediate render when navigating between admin tabs.
 */
export function getCachedAdminData(url) {
  if (typeof window === "undefined") return null;
  const entry = clientCache.get(url);
  if (!entry) return null;
  return entry.data;
}

/**
 * Fetches data with client-side caching.
 * If cached data exists and is fresh, returns immediately without network request.
 * If stale or bypassCache is set, performs background fetch and updates cache.
 */
export async function fetchWithClientCache(url, options = {}) {
  const { bypassCache = false, ttl = 30_000, ...fetchOptions } = options;
  const now = Date.now();

  const entry = clientCache.get(url);
  const isFresh = entry && now - entry.timestamp < ttl;

  if (!bypassCache && isFresh) {
    return { data: entry.data, success: true, fromCache: true };
  }

  try {
    const res = await fetch(url, fetchOptions);
    const json = await res.json();

    if (res.ok) {
      clientCache.set(url, { data: json, timestamp: Date.now() });
      return { data: json, success: true, fromCache: false, res };
    } else {
      return { data: json, success: false, error: json.error || res.statusText, fromCache: false, res };
    }
  } catch (err) {
    // If network error but stale cache exists, fallback to stale cache
    if (entry) {
      return { data: entry.data, success: true, fromCache: true, fallback: true };
    }
    return { data: null, success: false, error: err.message, fromCache: false };
  }
}

/**
 * Invalidate cached URLs matching a pattern (e.g. after mutating actions).
 */
export function invalidateClientCache(urlPattern) {
  if (!urlPattern) {
    clientCache.clear();
    return;
  }
  for (const key of clientCache.keys()) {
    if (key.includes(urlPattern)) {
      clientCache.delete(key);
    }
  }
}
