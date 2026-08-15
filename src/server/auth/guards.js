import { getToken } from "next-auth/jwt";
import { prisma } from "@/server/db/prisma";

// Returns the decoded NextAuth JWT for a request, or null if unauthenticated.
export async function getAuthToken(request) {
  if (!request) return null;
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

  try {
    let token = await getToken({ req: request, secret });
    if (!token) {
      token = await getToken({ req: request, secret, secureCookie: true });
    }
    if (!token) {
      token = await getToken({ req: request, secret, secureCookie: false });
    }
    return token;
  } catch (err) {
    console.error("[getAuthToken] Error retrieving token:", err);
    return null;
  }
}

// True if the authenticated user owns/manages the given event
// (event organizer OR an EventManager row for that event).
export async function requireEventManager(eventId, token) {
  if (!token?.sub) return false;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });
  if (!event) return false;
  if (event.organizerId === token.sub) return true;
  const mgr = await prisma.eventManager.findUnique({
    where: { eventId_userId: { eventId, userId: token.sub } },
  });
  return Boolean(mgr);
}

// In-memory cache for Super Admin / Admin role verification (60-second TTL)
// to eliminate redundant DB lookups on high-frequency API requests.
const ROLE_CACHE_TTL_MS = 60_000;
const userRoleCache = new Map();

export function invalidateUserRoleCache(userId) {
  if (userId) {
    userRoleCache.delete(userId);
  } else {
    userRoleCache.clear();
  }
}

// Throws if the request's authenticated user is not a SUPER_ADMIN. Re-fetches
// the role with a 60-second cache so role checks don't block every request with
// cross-region database latency.
export async function requireSuperAdmin(request) {
  const token = await getAuthToken(request);

  if (!token?.sub) {
    throw new Error("UNAUTHORIZED");
  }

  const now = Date.now();
  const cached = userRoleCache.get(token.sub);
  if (cached && now - cached.cachedAt < ROLE_CACHE_TTL_MS) {
    return cached.user;
  }

  const user = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { id: true, role: true, permissions: true },
  });

  const normalizedRole = user?.role?.toUpperCase();
  if (!user || (normalizedRole !== "SUPER_ADMIN" && normalizedRole !== "ADMIN")) {
    throw new Error("UNAUTHORIZED");
  }

  userRoleCache.set(token.sub, { user, cachedAt: now });
  return user;
}

// Verifies that the user has a specific granular permission OR is SUPER_ADMIN
export async function requirePermission(request, requiredPermission) {
  const token = await getAuthToken(request);

  if (!token?.sub) {
    throw new Error("UNAUTHORIZED");
  }

  const now = Date.now();
  let user;
  const cached = userRoleCache.get(token.sub);
  if (cached && now - cached.cachedAt < ROLE_CACHE_TTL_MS) {
    user = cached.user;
  } else {
    user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, role: true, permissions: true },
    });

    if (!user) {
      throw new Error("UNAUTHORIZED");
    }

    userRoleCache.set(token.sub, { user, cachedAt: now });
  }

  const normalizedRole = user.role?.toUpperCase();
  if (normalizedRole === "SUPER_ADMIN" || normalizedRole === "ADMIN") {
    return user;
  }

  const userPermissions = user.permissions ? JSON.parse(user.permissions) : [];
  if (!Array.isArray(userPermissions) || !userPermissions.includes(requiredPermission)) {
    throw new Error("FORBIDDEN_PERMISSION");
  }

  return user;
}

