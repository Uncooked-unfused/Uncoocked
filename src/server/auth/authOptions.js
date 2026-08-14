import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/server/db/prisma";
import { verifyPassword } from "@/server/auth/password";
import { logAuthEvent } from "@/server/auth/log";
import { rateLimit, getClientIp } from "@/server/middleware/rateLimit";
import { verifyCaptcha } from "@/server/middleware/captcha";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Turnstile Token", type: "text" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        // Per-IP (or per-account fallback) rate limit on credential attempts (10 / minute).
        const clientIp = getClientIp(req);
        const rateKey = clientIp !== "unknown" ? `login:ip:${clientIp}` : `login:email:${email}`;
        const rl = rateLimit(rateKey, {
          limit: 10,
          windowMs: 60 * 1000,
        });
        if (!rl.success) {
          logAuthEvent("login_rate_limited", { ip: clientIp, email });
          return null;
        }

        if (credentials?.turnstileToken) {
          const captchaValid = await verifyCaptcha(credentials.turnstileToken, clientIp);
          if (!captchaValid) {
            logAuthEvent("login_captcha_failed", { ip: clientIp });
            return null;
          }
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            fullName: true,
            name: true,
            role: true,
            passwordHash: true,
            onboardingCompleted: true,
            failedLoginAttempts: true,
            lockedUntil: true,
            emailVerified: true,
          },
        });

        // Account-level lockout (does not reveal whether the email exists).
        if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
          logAuthEvent("login_blocked_locked", { email });
          return null;
        }

        if (!user || !user.passwordHash) {
          if (user && user.passwordHash === null) {
            logAuthEvent("login_blocked_reset_required", { email });
            throw new Error("For your security, please use 'Forgot Password' to set a new password.");
          }
          // Generic failure: do not disclose whether the account exists.
          logAuthEvent("login_failure", { email, reason: "invalid_credentials" });
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          const attempts = (user.failedLoginAttempts || 0) + 1;
          if (attempts >= MAX_FAILED_ATTEMPTS) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: attempts,
                lockedUntil: new Date(Date.now() + LOCK_DURATION_MS),
              },
            });
            logAuthEvent("account_locked", { email, attempts });
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: attempts },
            });
            logAuthEvent("login_failure", { email, attempts });
          }
          return null;
        }

        // Successful login: reset the failure counter.
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }
        logAuthEvent("login_success", { email });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName || user.name,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
          emailVerified: Boolean(user.emailVerified),
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 hours
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.onboardingCompleted = user.onboardingCompleted;
        token.emailVerified = Boolean(user.emailVerified);
      }

      if (trigger === "update" && session?.onboardingCompleted !== undefined) {
        token.onboardingCompleted = session.onboardingCompleted;
      }
      if (trigger === "update" && session?.emailVerified !== undefined) {
        token.emailVerified = session.emailVerified;
      }
      if (trigger === "update" && session?.role !== undefined) {
        token.role = session.role;
      }
      if (trigger === "update" && session?.permissions !== undefined) {
        token.permissions = session.permissions;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.onboardingCompleted = token.onboardingCompleted;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

