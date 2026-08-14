// Lightweight in-memory rate limiter (per-IP). Suitable for a single-instance
// MVP. For multi-instance production, swap this Map for Redis/Upstash.
const buckets = new Map();

// Entry shape: { count: number, resetAt: number }
export function rateLimit(key, { limit = 10, windowMs = 60 * 1000 } = {}) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { success: false, remaining: 0, retryAfter };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: limit - entry.count,
    retryAfter: 0,
  };
}

// Extract the client IP from a NextRequest, route-handler Request, or NextAuth req object.
export function getClientIp(request) {
  if (!request) return "unknown";

  // If request has headers.get (NextRequest / standard Request)
  if (typeof request.headers?.get === "function") {
    const fwd = request.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    return request.headers.get("x-real-ip") || "unknown";
  }

  // If request.headers is a plain object (Node / NextAuth req)
  if (request.headers && typeof request.headers === "object") {
    const fwd = request.headers["x-forwarded-for"] || request.headers["X-Forwarded-For"];
    if (fwd) {
      return Array.isArray(fwd) ? fwd[0].trim() : String(fwd).split(",")[0].trim();
    }
    const realIp = request.headers["x-real-ip"] || request.headers["X-Real-IP"];
    if (realIp) return Array.isArray(realIp) ? realIp[0].trim() : String(realIp).trim();
  }

  return request.ip || request.socket?.remoteAddress || "unknown";
}

// Wrapper for API route controllers to enforce admin rate limiting
export function withAdminRateLimit(handler, { limit = 20, windowMs = 60 * 1000 } = {}) {
  return async function (request, context) {
    const ip = getClientIp(request);
    // Dynamic import getAuthToken to avoid circular dependencies if needed
    let userId = null;
    try {
      const { getAuthToken } = await import("@/server/auth/guards");
      const token = await getAuthToken(request);
      userId = token?.sub;
    } catch (e) {
      // Fallback to IP if token extraction fails
    }

    const key = `admin_rl:${userId || ip}`;
    const rl = rateLimit(key, { limit, windowMs });

    if (!rl.success) {
      const { NextResponse } = await import("next/server");
      return NextResponse.json(
        { error: "Too many administrative requests. Please wait before retrying.", retryAfter: rl.retryAfter },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    return handler(request, context);
  };
}

