/**
 * Quick SMTP Test Utility
 * Run with: node scripts/test-smtp.js [recipient-email@example.com]
 */
import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

function loadEnv() {
  const envFiles = [".env", ".env.local"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

async function testSmtp() {
  const recipient = process.argv[2] || process.env.SMTP_USER;

  const host = process.env.SMTP_HOST || "smtp.titan.email";
  const port = Number(process.env.SMTP_PORT || 465);
  const isSecure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `UNCOOKED <${user}>`;

  console.log("=========================================");
  console.log("  🔍 Testing SMTP Connection & Credentials");
  console.log("=========================================");
  console.log(`• Host:     ${host}`);
  console.log(`• Port:     ${port}`);
  console.log(`• Secure:   ${isSecure}`);
  console.log(`• User:     ${user || "(not set)"}`);
  console.log(`• From:     ${from}`);
  console.log(`• To:       ${recipient || "(not set)"}`);
  console.log("-----------------------------------------");

  if (!user || !pass || pass === "ENTER_YOUR_TITAN_PASSWORD_HERE") {
    console.log("⚠️ Note: Please replace 'ENTER_YOUR_TITAN_PASSWORD_HERE' in your .env / .env.local with your real Titan email password, then re-run.");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("⏳ Connecting to mail server...");
    await transporter.verify();
    console.log("✅ SMTP Connection & Authentication Successful!\n");

    if (recipient) {
      console.log(`📧 Sending test email to ${recipient}...`);
      const info = await transporter.sendMail({
        from,
        to: recipient,
        subject: "🎉 UNCOOKED: Custom GoDaddy Email Connected Successfully",
        html: `
          <div style="font-family: sans-serif; padding: 24px; background: #0a0a0a; color: #ffffff; border-radius: 8px; border: 1px solid #262626; max-width: 500px;">
            <h2 style="color: #F59E0B; margin-top: 0;">UNCOOKED System Test</h2>
            <p style="color: #e5e5e5; font-size: 14px; line-height: 1.6;">
              Your custom GoDaddy email (<strong style="color: #ffffff;">${user}</strong>) is successfully connected and transmitting emails through the UNCOOKED platform!
            </p>
            <hr style="border: 0; border-top: 1px solid #333333; margin: 20px 0;" />
            <p style="font-size: 11px; color: #888888; margin: 0;">Delivered at: ${new Date().toLocaleString()}</p>
          </div>
        `,
      });
      console.log(`✅ Test email delivered successfully! Message ID: ${info.messageId}`);
    }
  } catch (err) {
    console.error("\n❌ SMTP Verification Failed:");
    console.error(err.message);
    console.log("\n💡 Troubleshooting Tips:");
    if (host.includes("titan.email")) {
      console.log("1. Ensure your SMTP_USER is 'support@uncooked.in' (or your full email address).");
      console.log("2. Ensure your SMTP_PASS matches the password you use to log into Titan webmail (secureserver.titan.email).");
      console.log("3. If port 465 fails, try SMTP_PORT=\"587\" and SMTP_SECURE=\"false\".");
    }
  }
}

testSmtp();
