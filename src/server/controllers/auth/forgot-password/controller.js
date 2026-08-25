import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { generateResetToken } from "@/server/auth/resetToken";
import { sendEmail } from "@/server/services/emailService";
import { logAuthEvent } from "@/server/auth/log";
import { rateLimit, getClientIp } from "@/server/middleware/rateLimit";
import { verifyCaptcha } from "@/server/middleware/captcha";
import { getBaseUrl } from "@/server/utils/baseUrl";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export async function POST(request) {
  try {
    const rl = await rateLimit(`forgot-password:${getClientIp(request)}`, {
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
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = generateResetToken(user);
      const baseUrl = getBaseUrl(request);
      const resetUrl = `${baseUrl}/reset-password/${token}`;


      if (process.env.NODE_ENV === "development") {
        console.log("\n========================================================");
        console.log("🔗 LOCAL DEV RESET LINK for:", user.email);
        console.log(resetUrl);
        console.log("========================================================\n");
      }

      try {
        await sendEmail({
          to: user.email,
          subject: "Password Reset Request - UNCOOKED",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #111; padding: 24px; border-radius: 12px; border: 1px solid #333; color: #fff;">
              <h2 style="color: #A855F7; margin-top: 0;">Password Reset Request</h2>
              <p style="color: #ccc;">We received a request to reset your password for your UNCOOKED account (<strong>${user.email}</strong>).</p>
              <p style="color: #ccc;">Click the button below to set a new password. This link is valid for <strong>1 hour</strong> and can only be used once:</p>
              <p style="margin: 28px 0;">
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #A855F7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
              </p>
              <p style="color: #999; font-size: 13px;">If the button above does not work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 13px;"><a href="${resetUrl}" style="color: #C084FC;">${resetUrl}</a></p>
              <hr style="border: 0; border-top: 1px solid #222; margin: 24px 0;" />
              <p style="font-size: 12px; color: #666;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
          `,
        });
        logAuthEvent("forgot_password_email_sent", { email: user.email });
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
        logAuthEvent("forgot_password_email_failure", { email: user.email });
      }
    } else {
      logAuthEvent("forgot_password_nonexistent_email", { email });
    }

    // Always return a generic success response to prevent account enumeration
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password route error:", error);
    logAuthEvent("forgot_password_error", { reason: "server_error" });
    return NextResponse.json(
      { error: "Failed to process request. Please try again later." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
