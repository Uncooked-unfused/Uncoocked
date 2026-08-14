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

// Throws if the request's authenticated user is not a SUPER_ADMIN. Re-fetches
// the role from the database rather than trusting the JWT alone, so a role
// change takes effect immediately rather than waiting for the token to
// refresh. Returns the fresh user record ({ id, role }) on success.
export async function requireSuperAdmin(request) {
  const token = await getAuthToken(request);

  if (!token?.sub) {
    throw new Error("UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { id: true, role: true, permissions: true },
  });

  const normalizedRole = user?.role?.toUpperCase();
  if (!user || (normalizedRole !== "SUPER_ADMIN" && normalizedRole !== "ADMIN")) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

// Verifies that the user has a specific granular permission OR is SUPER_ADMIN
export async function requirePermission(request, requiredPermission) {
  const token = await getAuthToken(request);

  if (!token?.sub) {
    throw new Error("UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { id: true, role: true, permissions: true },
  });

  if (!user) {
    throw new Error("UNAUTHORIZED");
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

