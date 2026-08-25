import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { verifyResetToken } from "@/server/auth/resetToken";
import { hashPassword, isStrongPassword } from "@/server/auth/password";
import { logAuthEvent } from "@/server/auth/log";
import { rateLimit, getClientIp } from "@/server/middleware/rateLimit";
import { verifyCaptcha } from "@/server/middleware/captcha";

export async function POST(request) {
  try {
    const rl = await rateLimit(`reset-password:${getClientIp(request)}`, {
      limit: 5,
      windowMs: 60 * 1000,
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await request.json();
    if (body.turnstileToken || body.captchaToken) {
      const captchaValid = await verifyCaptcha(body.turnstileToken || body.captchaToken, getClientIp(request));
      if (!captchaValid) {
        return NextResponse.json({ error: "Captcha verification failed. Please try again." }, { status: 400 });
      }
    }
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters and include both letters and numbers.",
        },
        { status: 400 }
      );
    }

    const verification = await verifyResetToken(token);
    if (!verification.valid) {
      logAuthEvent("password_reset_invalid_token", { reason: verification.error });
      return NextResponse.json(
        { error: verification.error },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: verification.user.id },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    logAuthEvent("password_reset_success", { email: verification.email });
    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset password route error:", error);
    logAuthEvent("password_reset_error", { reason: "server_error" });
    return NextResponse.json(
      { error: "Failed to reset password. Please try again later." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
