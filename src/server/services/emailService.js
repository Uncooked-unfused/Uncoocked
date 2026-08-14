import nodemailer from "nodemailer";

export const SMTP_FROM =
  process.env.SMTP_FROM ||
  process.env.SMTP_USER ||
  "UNCOOKED <support@uncooked.in>";

export const RESEND_TO = process.env.RESEND_TO || "unfusedz.admin@gmail.com";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Cached SMTP transporter singleton to avoid recreating connections on each send
let transporterInstance = null;

function getTransporter() {
  if (!transporterInstance) {
    const port = Number(process.env.SMTP_PORT || 465);
    const isSecure =
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === "true"
        : port === 465;

    transporterInstance = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.titan.email",
      port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
    });
  }
  return transporterInstance;
}

/**
 * Sends an email using SMTP or simulates delivery in development.
 */
export async function sendEmail({ to = RESEND_TO, subject, html, attachments }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP_USER or SMTP_PASS not configured in .env. Simulating email send for development.");
    console.log(`\n[SIMULATED EMAIL TO ${to}]\nSubject: ${subject}\n==========================================\n`);
    return { simulated: true };
  }

  const transporter = getTransporter();
  return transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
    attachments,
  });
}

/**
 * Sends notification email when an account status is updated (Suspended / Reactivated).
 */
export async function sendAccountStatusEmail({ email, name, isSuspending, reason, baseUrl = "https://uncooked.in" }) {
  if (!email) return null;

  const safeName = escapeHtml(name || "User");
  const safeReason = escapeHtml(reason || (isSuspending ? "Violation of community guidelines or policy review" : "Administrative review completed"));
  const actionText = isSuspending ? "Suspended" : "Reactivated";
  const themeColor = isSuspending ? "#EF4444" : "#10B981";
  const subject = isSuspending
    ? "Important: Your UNCOOKED Account Has Been Suspended"
    : "Your UNCOOKED Account Has Been Reactivated";

  const bodyText = isSuspending
    ? "Your UNCOOKED account has been suspended by a platform administrator. While suspended, your access to protected features and event hosting privileges is temporarily restricted."
    : "Your UNCOOKED account access has been restored by a platform administrator. You can now sign in and access all platform features normally.";

  const actionBlock = !isSuspending
    ? `<div style="margin: 28px 0;">
         <a href="${baseUrl}/login" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px;">Sign In to UNCOOKED &rarr;</a>
       </div>`
    : `<p style="color: #a3a3a3; font-size: 13px; line-height: 1.5;">
         If you believe this was done in error or would like to appeal this decision, please reach out to our support team at <a href="mailto:support@uncooked.in" style="color: #F59E0B;">support@uncooked.in</a>.
       </p>`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px 24px; border-radius: 12px; border: 1px solid #262626;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #262626; padding-bottom: 16px;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: ${themeColor}; text-transform: uppercase; font-family: monospace;">Account Security &amp; Governance</span>
        <h2 style="color: #ffffff; margin: 8px 0 0 0; font-size: 22px; font-weight: 900;">Account ${actionText}</h2>
      </div>
      <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6;">Hello <strong>${safeName}</strong>,</p>
      <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6;">${bodyText}</p>
      <div style="background: #171717; border-left: 4px solid ${themeColor}; border-radius: 6px; padding: 14px 18px; margin: 24px 0;">
        <span style="display: block; font-size: 11px; font-weight: 700; color: #a3a3a3; text-transform: uppercase; margin-bottom: 4px;">Reason / Details:</span>
        <p style="color: #ffffff; font-size: 13px; margin: 0; line-height: 1.5; font-style: italic;">&ldquo;${safeReason}&rdquo;</p>
      </div>
      ${actionBlock}
      <hr style="border: 0; border-top: 1px solid #262626; margin: 28px 0 20px 0;" />
      <p style="font-size: 11px; color: #737373; margin: 0; line-height: 1.4;">
        This is an automated governance notification from UNCOOKED Platform Administration.
      </p>
    </div>
  `;

  try {
    return await sendEmail({ to: email, subject, html });
  } catch (err) {
    console.error("Failed to send account status email:", err);
    return null;
  }
}

/**
 * Sends notification email when a user's role is updated.
 */
export async function sendUserRoleUpdatedEmail({ email, name, oldRole, newRole, reason, baseUrl = "https://uncooked.in" }) {
  if (!email) return null;

  const safeName = escapeHtml(name || "User");
  const safeOld = escapeHtml(oldRole || "USER");
  const safeNew = escapeHtml(newRole || "USER");
  const safeReason = escapeHtml(reason || `Role updated from ${safeOld} to ${safeNew}`);
  const subject = "UNCOOKED: Your Account Role Has Been Updated";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px 24px; border-radius: 12px; border: 1px solid #262626;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #262626; padding-bottom: 16px;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #F59E0B; text-transform: uppercase; font-family: monospace;">Role &amp; Permissions Update</span>
        <h2 style="color: #ffffff; margin: 8px 0 0 0; font-size: 22px; font-weight: 900;">Account Role Updated</h2>
      </div>
      <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6;">Hello <strong>${safeName}</strong>,</p>
      <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6;">Your role on the UNCOOKED platform has been updated by an administrator:</p>
      <div style="background: #171717; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #262626;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 12px; color: #a3a3a3;">Previous Role:</span>
          <span style="font-size: 12px; color: #e5e5e5; font-family: monospace; font-weight: bold;">${safeOld}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-size: 12px; color: #a3a3a3;">New Assigned Role:</span>
          <span style="font-size: 12px; color: #F59E0B; font-family: monospace; font-weight: 900;">${safeNew}</span>
        </div>
      </div>
      <div style="background: #171717; border-left: 4px solid #F59E0B; border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
        <span style="display: block; font-size: 11px; font-weight: 700; color: #a3a3a3; text-transform: uppercase; margin-bottom: 4px;">Notes / Context:</span>
        <p style="color: #ffffff; font-size: 13px; margin: 0; line-height: 1.5; font-style: italic;">&ldquo;${safeReason}&rdquo;</p>
      </div>
      <div style="margin: 28px 0;">
        <a href="${baseUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px;">Go to Dashboard &rarr;</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #262626; margin: 28px 0 20px 0;" />
      <p style="font-size: 11px; color: #737373; margin: 0; line-height: 1.4;">
        This is an automated governance notification from UNCOOKED.
      </p>
    </div>
  `;

  try {
    return await sendEmail({ to: email, subject, html });
  } catch (err) {
    console.error("Failed to send role update email:", err);
    return null;
  }
}

/**
 * Sends notification email when a host verification application status changes or info is requested.
 */
export async function sendHostApplicationUpdateEmail({
  email,
  name,
  organizationName,
  action,
  notes,
  baseUrl = "https://uncooked.in",
}) {
  if (!email) return null;

  const safeName = escapeHtml(name || "Host Applicant");
  const safeOrg = escapeHtml(organizationName || "Your Organization");
  const safeNotes = escapeHtml(notes || "");

  const actionConfigs = {
    REQUEST_INFO: {
      subject: `Action Required: More Information Needed for ${safeOrg} - UNCOOKED`,
      title: "Action Required: Information Requested",
      themeColor: "#A855F7",
      actionButtonText: "Update Application Details &rarr;",
      actionButtonHref: `${baseUrl}/host/apply`,
      description: `The verification team is reviewing your application for <strong>${safeOrg}</strong> and has requested additional details or supporting documents before finalizing approval.`,
    },
    APPROVE: {
      subject: `Congratulations! ${safeOrg} is Verified on UNCOOKED 🎉`,
      title: "Host Application Approved!",
      themeColor: "#10B981",
      actionButtonText: "Create Your First Event &rarr;",
      actionButtonHref: `${baseUrl}/dashboard/organizer/new`,
      description: `Congratulations! Your organization verification application for <strong>${safeOrg}</strong> has been officially approved. You now have full access to publish, manage, and scale events on UNCOOKED.`,
    },
    REJECT: {
      subject: `Host Verification Application Update for ${safeOrg} - UNCOOKED`,
      title: "Application Not Approved",
      themeColor: "#EF4444",
      actionButtonText: "Review Application Status",
      actionButtonHref: `${baseUrl}/host/status`,
      description: `Thank you for your interest in hosting with UNCOOKED. After careful review, your application for <strong>${safeOrg}</strong> could not be approved at this time.`,
    },
    SUSPEND: {
      subject: `Notice: Host Privileges Suspended for ${safeOrg} - UNCOOKED`,
      title: "Host Privileges Suspended",
      themeColor: "#EF4444",
      actionButtonText: "View Status & Appeals",
      actionButtonHref: `${baseUrl}/host/status`,
      description: `Your host privileges and verification for <strong>${safeOrg}</strong> have been suspended by an administrator.`,
    },
    REINSTATE: {
      subject: `Host Privileges Reinstated for ${safeOrg} - UNCOOKED`,
      title: "Host Privileges Reinstated",
      themeColor: "#10B981",
      actionButtonText: "Go to Host Dashboard &rarr;",
      actionButtonHref: `${baseUrl}/dashboard`,
      description: `Your host status and verification for <strong>${safeOrg}</strong> have been reinstated. You may now publish and host events again.`,
    },
  };

  const config = actionConfigs[action] || {
    subject: `Host Application Update: ${safeOrg} - UNCOOKED`,
    title: "Application Status Update",
    themeColor: "#F59E0B",
    actionButtonText: "View Application Status",
    actionButtonHref: `${baseUrl}/host/status`,
    description: `There has been an update to your host verification application for <strong>${safeOrg}</strong>.`,
  };

  const textColor = ["#10B981", "#EF4444", "#A855F7"].includes(config.themeColor) ? "#ffffff" : "#000000";

  const feedbackBlock = safeNotes
    ? `<div style="background: #171717; border-left: 4px solid ${config.themeColor}; border-radius: 6px; padding: 14px 18px; margin: 24px 0;">
         <span style="display: block; font-size: 11px; font-weight: 700; color: #a3a3a3; text-transform: uppercase; margin-bottom: 4px;">Review Feedback / Required Action:</span>
         <p style="color: #ffffff; font-size: 13px; margin: 0; line-height: 1.5; font-style: italic;">&ldquo;${safeNotes}&rdquo;</p>
       </div>`
    : "";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px 24px; border-radius: 12px; border: 1px solid #262626;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #262626; padding-bottom: 16px;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: ${config.themeColor}; text-transform: uppercase; font-family: monospace;">Host Verification Portal</span>
        <h2 style="color: #ffffff; margin: 8px 0 0 0; font-size: 22px; font-weight: 900;">${config.title}</h2>
      </div>
      <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6;">Hello <strong>${safeName}</strong>,</p>
      <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6;">${config.description}</p>
      ${feedbackBlock}
      <div style="margin: 28px 0;">
        <a href="${config.actionButtonHref}" style="display: inline-block; padding: 12px 24px; background-color: ${config.themeColor}; color: ${textColor}; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px;">${config.actionButtonText}</a>
      </div>
      <p style="color: #a3a3a3; font-size: 12px; line-height: 1.5;">
        You can also track your real-time verification and notification timeline at: <br />
        <a href="${baseUrl}/host/status" style="color: #F59E0B; word-break: break-all;">${baseUrl}/host/status</a>
      </p>
      <hr style="border: 0; border-top: 1px solid #262626; margin: 28px 0 20px 0;" />
      <p style="font-size: 11px; color: #737373; margin: 0; line-height: 1.4;">
        This is an official verification notice from UNCOOKED Platform Administration.
      </p>
    </div>
  `;

  try {
    return await sendEmail({ to: email, subject: config.subject, html });
  } catch (err) {
    console.error("Failed to send host application email:", err);
    return null;
  }
}

/**
 * Sends notification email when an event is moderated (Suspended / Restored / Archived).
 */
export async function sendEventModerationEmail({
  email,
  name,
  eventTitle,
  action,
  reason,
  baseUrl = "https://uncooked.in",
}) {
  if (!email) return null;

  const safeName = escapeHtml(name || "Organizer");
  const safeTitle = escapeHtml(eventTitle || "Your Event");
  const safeReason = escapeHtml(reason || "");

  const actionMap = {
    SUSPEND: {
      subject: `Important: Event "${safeTitle}" Has Been Suspended - UNCOOKED`,
      title: "Event Suspended by Moderator",
      themeColor: "#EF4444",
    },
    RESTORE: {
      subject: `Event "${safeTitle}" Has Been Restored - UNCOOKED`,
      title: "Event Restored & Active",
      themeColor: "#10B981",
    },
    ARCHIVE: {
      subject: `Event "${safeTitle}" Has Been Archived - UNCOOKED`,
      title: "Event Archived",
      themeColor: "#8B5CF6",
    },
  };

  const config = actionMap[action] || {
    subject: `Notice: Moderation Action for Event "${safeTitle}" - UNCOOKED`,
    title: "Event Moderation Update",
    themeColor: "#F59E0B",
  };

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 32px 24px; border-radius: 12px; border: 1px solid #262626;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #262626; padding-bottom: 16px;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: ${config.themeColor}; text-transform: uppercase; font-family: monospace;">Event Moderation</span>
        <h2 style="color: #ffffff; margin: 8px 0 0 0; font-size: 22px; font-weight: 900;">${config.title}</h2>
      </div>
      <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6;">Hello <strong>${safeName}</strong>,</p>
      <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6;">
        An administrative moderation action was performed on your event <strong>&ldquo;${safeTitle}&rdquo;</strong>:
      </p>
      <div style="background: #171717; border-left: 4px solid ${config.themeColor}; border-radius: 6px; padding: 14px 18px; margin: 24px 0;">
        <span style="display: block; font-size: 11px; font-weight: 700; color: #a3a3a3; text-transform: uppercase; margin-bottom: 4px;">Moderator Notes / Reason:</span>
        <p style="color: #ffffff; font-size: 13px; margin: 0; line-height: 1.5; font-style: italic;">&ldquo;${safeReason || "Automated or routine moderation check."}&rdquo;</p>
      </div>
      <div style="margin: 28px 0;">
        <a href="${baseUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px;">Go to Organizer Dashboard &rarr;</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #262626; margin: 28px 0 20px 0;" />
      <p style="font-size: 11px; color: #737373; margin: 0; line-height: 1.4;">
        This is an official moderation notification from UNCOOKED.
      </p>
    </div>
  `;

  try {
    return await sendEmail({ to: email, subject: config.subject, html });
  } catch (err) {
    console.error("Failed to send event moderation email:", err);
    return null;
  }
}

/**
 * Sends direct communication or document/media request email to a user.
 */
export async function sendDirectCommunicationEmail({
  email,
  name,
  subject,
  message,
  type = "NOTIFICATION",
  requiredDocType,
  instructions,
  priority = "NORMAL",
  deadline,
  requestId,
  baseUrl = "https://uncooked.in",
}) {
  if (!email) return null;

  const safeName = escapeHtml(name || "Member");
  const safeSubject = escapeHtml(subject || "Administrative Notice from UNCOOKED");
  const safeMessage = escapeHtml(message || "");
  const safeDocType = escapeHtml(requiredDocType || "Required Documentation");
  const safeInstructions = escapeHtml(instructions || "");

  const isDocRequest = type === "DOCUMENT_REQUEST" || type === "MEDIA_REQUEST";
  const isInfoRequest = type === "INFO_REQUEST" || type === "REQUEST_INFO";
  const isAnyRequest = isDocRequest || isInfoRequest;
  const isUrgent = priority === "URGENT";
  const isHigh = priority === "HIGH";

  const themeColor = isUrgent
    ? "#EF4444"
    : isHigh
    ? "#F59E0B"
    : isInfoRequest
    ? "#3B82F6"
    : isDocRequest
    ? "#A855F7"
    : "#10B981";

  const badgeLabel = isInfoRequest
    ? (isUrgent ? "URGENT: ACTION REQUIRED • INFO REQUEST" : "INFORMATION & CLARIFICATION REQUEST")
    : isDocRequest
    ? (isUrgent ? "URGENT: ACTION REQUIRED • DOCUMENT REQUEST" : "DOCUMENT & MEDIA REQUEST")
    : (isUrgent ? "URGENT NOTIFICATION" : "OFFICIAL ANNOUNCEMENT");

  const formattedDeadline = deadline
    ? new Date(deadline).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const requestCard = isAnyRequest
    ? `
      <div style="background: #171717; border-left: 4px solid ${themeColor}; border-radius: 8px; padding: 18px 20px; margin: 24px 0; border: 1px solid #262626;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 11px; font-weight: 800; color: ${themeColor}; text-transform: uppercase; letter-spacing: 1px; font-family: monospace;">${
            isInfoRequest ? "Information / Clarification Needed:" : "Requested Submission:"
          }</span>
          <span style="font-size: 11px; background: ${themeColor}20; color: ${themeColor}; padding: 2px 8px; border-radius: 4px; font-weight: bold; border: 1px solid ${themeColor}40;">${escapeHtml(priority)} Priority</span>
        </div>
        <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 16px; font-weight: 800;">${safeDocType}</h3>
        ${
          safeInstructions
            ? `<p style="color: #a3a3a3; font-size: 13px; margin: 0 0 12px 0; line-height: 1.5; font-style: italic;">&ldquo;${safeInstructions}&rdquo;</p>`
            : ""
        }
        ${
          formattedDeadline
            ? `<div style="font-size: 12px; color: #f87171; font-weight: bold; margin-top: 8px;">⏳ Response Deadline: ${formattedDeadline}</div>`
            : ""
        }
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${baseUrl}/requests/${requestId}" style="display: inline-block; padding: 14px 28px; background-color: ${themeColor}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 900; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 4px 14px ${themeColor}40;">
          ${isInfoRequest ? "Submit Requested Information &rarr;" : "Submit Response & Upload Document &rarr;"}
        </a>
      </div>
      <p style="color: #737373; font-size: 11px; text-align: center; margin-top: -12px; margin-bottom: 24px;">
        Responses and submissions are reviewed directly by the platform administration team.
      </p>
    `
    : `
      <div style="margin: 28px 0;">
        <a href="${baseUrl}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px;">Go to UNCOOKED Dashboard &rarr;</a>
      </div>
    `;

  const emailSubject = `[UNCOOKED] ${subject || (isAnyRequest ? `Action Required: ${safeDocType}` : "Platform Notification")}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 36px 28px; border-radius: 14px; border: 1px solid #262626;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #262626; padding-bottom: 18px;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: ${themeColor}; text-transform: uppercase; font-family: monospace;">${badgeLabel}</span>
        <h2 style="color: #ffffff; margin: 8px 0 0 0; font-size: 22px; font-weight: 900; line-height: 1.3;">${safeSubject}</h2>
      </div>

      <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6;">Hello <strong>${safeName}</strong>,</p>

      <div style="color: #d4d4d4; font-size: 14px; line-height: 1.6; margin: 16px 0; white-space: pre-line;">${safeMessage}</div>

      ${requestCard}

      <hr style="border: 0; border-top: 1px solid #262626; margin: 28px 0 20px 0;" />
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <p style="font-size: 11px; color: #737373; margin: 0; line-height: 1.4;">
          This is an official administrative communication from UNCOOKED Governance.
        </p>
      </div>
    </div>
  `;

  try {
    return await sendEmail({ to: email, subject: emailSubject, html });
  } catch (err) {
    console.error("Failed to send direct communication email:", err);
    return null;
  }
}

