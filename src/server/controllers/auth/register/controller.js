import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { hashPassword, isStrongPassword } from "@/server/auth/password";
import { logAuthEvent } from "@/server/auth/log";
import { rateLimit, getClientIp } from "@/server/middleware/rateLimit";
import { verifyCaptcha } from "@/server/middleware/captcha";
import { generateVerificationToken } from "@/server/auth/verificationToken";
import { sendEmail } from "@/server/services/emailService";
import { getBaseUrl } from "@/server/utils/baseUrl";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    // Per-IP rate limit on signup (10 requests / minute).
    const rl = await rateLimit(`register:${getClientIp(request)}`, {
      limit: 10,
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
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters and include both letters and numbers",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      logAuthEvent("signup_failure", { email, reason: "duplicate" });
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: fullName || "New User",
        onboardingCompleted: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const token = generateVerificationToken(user);
    const baseUrl = getBaseUrl(request);
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;


    if (process.env.NODE_ENV === "development") {
      console.log("\n========================================================");
      console.log("✉️ LOCAL DEV VERIFICATION LINK for:", user.email);
      console.log(verifyUrl);
      console.log("========================================================\n");
    }

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email - UNCOOKED",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #111; padding: 24px; border-radius: 12px; border: 1px solid #333; color: #fff;">
            <h2 style="color: #A855F7; margin-top: 0;">Verify Your Email Address</h2>
            <p style="color: #ccc;">Welcome to UNCOOKED! Please verify your email address (<strong>${user.email}</strong>) to confirm your inbox access and unlock protected campus event features.</p>
            <p style="color: #ccc;">Click the button below to verify your email. This link is valid for <strong>24 hours</strong>:</p>
            <p style="margin: 28px 0;">
              <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #A855F7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
            </p>
            <p style="color: #999; font-size: 13px;">If the button above does not work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 13px;"><a href="${verifyUrl}" style="color: #C084FC;">${verifyUrl}</a></p>
            <hr style="border: 0; border-top: 1px solid #222; margin: 24px 0;" />
            <p style="font-size: 12px; color: #666;">Note: This system verifies email ownership to ensure inbox access; it does not evaluate personal trustworthiness. If you did not create an account on UNCOOKED, you can safely ignore this email.</p>
          </div>
        `,
      });
      logAuthEvent("verification_email_sent", { email: user.email });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      logAuthEvent("verification_email_send_failure", { email: user.email });
    }

    logAuthEvent("signup_success", { email });
    return NextResponse.json({ success: true, email });
 } catch (error) {
  // Add this line temporarily to see the exact Prisma error in VS Code Terminal:
  console.error("DEBUG REGISTER ERROR:", error);

  logAuthEvent("signup_failure", { reason: "server_error" });
  return NextResponse.json(
    { error: "Failed to create account" },
    { status: 500 }
  );
}
}

export const dynamic = "force-dynamic";
