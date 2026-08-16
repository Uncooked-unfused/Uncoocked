import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  const path = req.nextUrl.pathname;

  // Extract JWT token securely from request cookies with multi-environment fallback
  let token = await getToken({
    req,
    secret,
  });

  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: true,
    });
  }

  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: false,
    });
  }

  // 1. Super Admin gating for /admin pages and /api/admin endpoints
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    if (!token || token.role !== "SUPER_ADMIN") {
      if (path.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "Forbidden: Super Admin access required." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(
        new URL(token ? "/dashboard" : `/login?callbackUrl=${encodeURIComponent(path)}`, req.url)
      );
    }
    return NextResponse.next();
  }

  // 2. Email verification check for creator & host routes
  if (token && !token.emailVerified) {
    if (
      path.startsWith("/dashboard/organizer") ||
      path.startsWith("/onboarding") ||
      path.startsWith("/profile") ||
      path.startsWith("/api/organizer")
    ) {
      return NextResponse.redirect(
        new URL(
          `/verify-email?notice=unverified&email=${encodeURIComponent(token.email || "")}`,
          req.url
        )
      );
    }
  }

  // 3. Verified host check for event creation and organizer tools
  if (path.startsWith("/dashboard/organizer")) {
    if (token && token.role !== "ORGANIZER" && token.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/host/status", req.url));
    }
  }

  // 4. Protected user routes requiring login
  const isProtectedUserRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/profile") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/host/apply") ||
    path.startsWith("/host/status") ||
    path.startsWith("/requests");

  if (isProtectedUserRoute && !token) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .txt, .xml)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
