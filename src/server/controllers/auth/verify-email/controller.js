import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { verifyVerificationToken, generateVerificationToken } from "@/server/auth/verificationToken";
import { sendEmail } from "@/server/services/emailService";
import { logAuthEvent } from "@/server/auth/log";
import { rateLimit, getClientIp } from "@/server/middleware/rateLimit";
import { getBaseUrl } from "@/server/utils/baseUrl";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const baseUrl = getBaseUrl(request);


    if (!token) {
      return NextResponse.redirect(
        new URL("/verify-email?error=" + encodeURIComponent("Missing verification token."), baseUrl)
      );
    }

    const verification = await verifyVerificationToken(token);
    if (!verification.valid) {
      logAuthEvent("email_verification_failure", { reason: verification.error });
      return NextResponse.redirect(
        new URL("/verify-email?error=" + encodeURIComponent(verification.error), baseUrl)
      );
    }

    if (verification.alreadyVerified) {
      logAuthEvent("email_verification_already_verified", { email: verification.email });
      return NextResponse.redirect(new URL("/verify-email?status=already_verified", baseUrl));
    }

    await prisma.user.update({
      where: { id: verification.user.id },
      data: { emailVerified: new Date() },
    });

    logAuthEvent("email_verification_success", { email: verification.email });
    return NextResponse.redirect(new URL("/verify-email?status=success", baseUrl));
  } catch (error) {
    console.error("Verify email GET route error:", error);
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(
      new URL("/verify-email?error=" + encodeURIComponent("Server error during verification."), baseUrl)
    );
  }
}

export async function POST(request) {
  try {
    const rl = await rateLimit(`resend-verification:${getClientIp(request)}`, {
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
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerified) {
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
        logAuthEvent("verification_email_resent", { email: user.email });
      } catch (emailError) {
        console.error("Failed to resend verification email:", emailError);
        logAuthEvent("verification_email_resend_failure", { email: user.email });
      }
    } else {
      logAuthEvent("verification_email_resend_skipped", { email, exists: Boolean(user) });
    }

    // Generic response to prevent account enumeration
    return NextResponse.json({
      success: true,
      message: "If an unverified account exists with this email, a verification link has been sent.",
    });
  } catch (error) {
    console.error("Resend verification route error:", error);
    logAuthEvent("verification_resend_error", { reason: "server_error" });
    return NextResponse.json(
      { error: "Failed to process request. Please try again later." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
