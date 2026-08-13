import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Edge middleware protecting admin routes, isolating admin role, and guarding protected routes
export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const path = req.nextUrl.pathname;

    // 1. SUPER_ADMIN Routing Isolation:
    // When signed in as Super Admin, the admin should ONLY access the Admin Dashboard/Console
    // and cannot access the consumer-facing website as a normal user.
    if (token?.role === "SUPER_ADMIN") {
      // Allow admin pages, admin APIs, auth endpoints, and system telemetry/health
      if (
        path.startsWith("/admin") ||
        path.startsWith("/api/admin") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/health")
      ) {
        return NextResponse.next();
      }

      // Automatically redirect all normal user website pages to the admin dashboard
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // 2. Super Admin gating for /admin pages and /api/admin endpoints
    if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
      if (!token || token.role !== "SUPER_ADMIN") {
        if (path.startsWith("/api/admin")) {
          return NextResponse.json(
            { error: "Forbidden: Super Admin access required." },
            { status: 403 }
          );
        }
        return NextResponse.redirect(
          new URL(token ? "/dashboard" : "/login", req.url)
        );
      }
      return NextResponse.next();
    }

    // 3. Email verification check for creator & host routes
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

    // 4. Protected user routes requiring login
    const isProtectedUserRoute =
      path.startsWith("/dashboard") ||
      path.startsWith("/profile") ||
      path.startsWith("/onboarding") ||
      path.startsWith("/host");

    if (isProtectedUserRoute && !token) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, req.url)
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized() {
        // Return true to allow middleware to handle role and route routing
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

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
