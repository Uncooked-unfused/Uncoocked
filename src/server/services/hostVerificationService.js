import { prisma } from "@/server/db/prisma";
import { sendHostApplicationUpdateEmail } from "@/server/services/emailService";

export const HOST_APPLICATION_STATUS = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  NEEDS_MORE_INFORMATION: "NEEDS_MORE_INFORMATION",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
};

// State transition rules: Map of current status -> allowed next statuses
const VALID_TRANSITIONS = {
  PENDING: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "NEEDS_MORE_INFORMATION"],
  UNDER_REVIEW: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "NEEDS_MORE_INFORMATION"],
  NEEDS_MORE_INFORMATION: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "NEEDS_MORE_INFORMATION"],
  APPROVED: ["APPROVED", "SUSPENDED", "UNDER_REVIEW", "REJECTED", "NEEDS_MORE_INFORMATION"],
  SUSPENDED: ["SUSPENDED", "APPROVED", "REJECTED", "UNDER_REVIEW", "NEEDS_MORE_INFORMATION"],
  REJECTED: ["REJECTED", "PENDING", "UNDER_REVIEW", "APPROVED", "NEEDS_MORE_INFORMATION"],
};

/**
 * Reusable eligibility checker: Determines whether a user is authorized to create/host events.
 * Returns true if user is SUPER_ADMIN or holds ORGANIZER role with an APPROVED HostApplication.
 */
export async function isUserEligibleToHost(userId) {
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role !== "ORGANIZER") return false;

  const application = await prisma.hostApplication.findUnique({
    where: { userId: user.id },
    select: { status: true },
  });

  return application?.status === HOST_APPLICATION_STATUS.APPROVED;
}

/**
 * Submits a new host application or updates a resubmitted application for a user.
 * Enforces single active application per user rule.
 */
export async function createHostApplication(userId, applicationData) {
  if (!userId) throw new Error("User ID is required");

  const { organizationName, organizationType, organizationEmail, address, description, documentUrls, website } = applicationData;
  if (!organizationName?.trim()) {
    throw new Error("Organization name is required");
  }
  if (!organizationType?.trim()) {
    throw new Error("Organization type is required");
  }
  if (!organizationEmail?.trim()) {
    throw new Error("Official organization email is required");
  }
  if (!address?.trim()) {
    throw new Error("Campus location / physical address is required");
  }
  if (!description?.trim()) {
    throw new Error("Organization overview description is required");
  }
  if (!documentUrls || (typeof documentUrls === "object" && !documentUrls.idProofUrl && Object.keys(documentUrls).length === 0)) {
    throw new Error("Identity proof / authorization document link is required");
  }

  const existingApp = await prisma.hostApplication.findUnique({
    where: { userId },
  });

  if (existingApp) {
    if (
      existingApp.status === HOST_APPLICATION_STATUS.PENDING ||
      existingApp.status === HOST_APPLICATION_STATUS.UNDER_REVIEW ||
      existingApp.status === HOST_APPLICATION_STATUS.APPROVED
    ) {
      throw new Error(`An active host application already exists with status: ${existingApp.status}`);
    }

    // Allow updating existing application if in NEEDS_MORE_INFORMATION or REJECTED status
    if (
      existingApp.status === HOST_APPLICATION_STATUS.NEEDS_MORE_INFORMATION ||
      existingApp.status === HOST_APPLICATION_STATUS.REJECTED
    ) {
      return prisma.$transaction(async (tx) => {
        const updated = await tx.hostApplication.update({
          where: { id: existingApp.id },
          data: {
            organizationName: organizationName.trim(),
            organizationType: organizationType.trim(),
            organizationEmail: organizationEmail.trim(),
            website: website?.trim() || null,
            address: address.trim(),
            description: description.trim(),
            documentUrls: typeof documentUrls === "string" ? documentUrls : JSON.stringify(documentUrls),
            status: HOST_APPLICATION_STATUS.PENDING,
            rejectionReason: null,
            infoRequestedReason: null,
          },
        });

        const auditClient = tx.auditLog || prisma.auditLog;
        if (auditClient?.create) {
          await auditClient.create({
            data: {
              action: "APPLICATION_RESUBMITTED",
              applicationId: existingApp.id,
              adminId: userId,
              previousStatus: existingApp.status,
              newStatus: HOST_APPLICATION_STATUS.PENDING,
              reason: "User resubmitted updated host application",
            },
          });
        }

        return updated;
      });
    }
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.hostApplication.create({
      data: {
        userId,
        organizationName: organizationName.trim(),
        organizationType: organizationType.trim(),
        organizationEmail: organizationEmail.trim(),
        website: website?.trim() || null,
        address: address.trim(),
        description: description.trim(),
        documentUrls: typeof documentUrls === "string" ? documentUrls : JSON.stringify(documentUrls),
        status: HOST_APPLICATION_STATUS.PENDING,
      },
    });

    const auditClient = tx.auditLog || prisma.auditLog;
    if (auditClient?.create) {
      await auditClient.create({
        data: {
          action: "APPLICATION_SUBMITTED",
          applicationId: created.id,
          adminId: userId,
          previousStatus: "UNSUBMITTED",
          newStatus: HOST_APPLICATION_STATUS.PENDING,
          reason: "Initial host application submission",
        },
      });
    }

    return created;
  });
}

/**
 * Retrieves host application details by user ID.
 */
export async function getHostApplicationByUserId(userId) {
  if (!userId) return null;
  return prisma.hostApplication.findUnique({
    where: { userId },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      auditLogs: { orderBy: { timestamp: "desc" } },
    },
  });
}

/**
 * Retrieves host application details by application ID.
 */
export async function getHostApplicationById(applicationId) {
  if (!applicationId) return null;
  return prisma.hostApplication.findUnique({
    where: { id: applicationId },
    include: {
      user: {
        select: { id: true, name: true, fullName: true, email: true, role: true, createdAt: true },
      },
      notes: { orderBy: { createdAt: "desc" } },
      auditLogs: { orderBy: { timestamp: "desc" } },
    },
  });
}

/**
 * Process admin review actions (APPROVE, REJECT, REQUEST_INFO, SUSPEND, REINSTATE).
 * Enforces valid state machine transitions and updates user role atomically.
 */
export async function processReviewAction(applicationId, adminId, action, notes) {
  const existingApp = await prisma.hostApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      status: true,
      userId: true,
      organizationName: true,
      user: {
        select: { id: true, email: true, name: true, fullName: true },
      },
    },
  });

  if (!existingApp) throw new Error("Application not found");

  let nextStatus;
  let targetUserRole = null;

  switch (action) {
    case "APPROVE_SUPER_ADMIN":
      nextStatus = HOST_APPLICATION_STATUS.APPROVED;
      targetUserRole = "SUPER_ADMIN";
      break;
    case "APPROVE":
      nextStatus = HOST_APPLICATION_STATUS.APPROVED;
      targetUserRole = "ORGANIZER";
      break;
    case "REJECT":
      nextStatus = HOST_APPLICATION_STATUS.REJECTED;
      break;
    case "REQUEST_INFO":
      nextStatus = HOST_APPLICATION_STATUS.NEEDS_MORE_INFORMATION;
      break;
    case "SUSPEND":
      nextStatus = HOST_APPLICATION_STATUS.SUSPENDED;
      targetUserRole = "USER";
      break;
    case "REINSTATE":
      nextStatus = HOST_APPLICATION_STATUS.APPROVED;
      targetUserRole = "ORGANIZER";
      break;
    default:
      throw new Error(`Invalid review action: ${action}`);
  }

  // Enforce valid status transition
  const allowedNext = VALID_TRANSITIONS[existingApp.status] || [];
  if (!allowedNext.includes(nextStatus)) {
    throw new Error(`Invalid status transition from ${existingApp.status} to ${nextStatus}`);
  }

  // Perform database updates inside transaction
  const updatedApp = await prisma.$transaction(async (tx) => {
    const updated = await tx.hostApplication.update({
      where: { id: applicationId },
      data: {
        status: nextStatus,
        ...(action === "REJECT" && { rejectionReason: notes || null }),
        ...(action === "REQUEST_INFO" && { infoRequestedReason: notes || null }),
      },
    });

    if (targetUserRole) {
      await tx.user.update({
        where: { id: existingApp.userId },
        data: { role: targetUserRole },
      });
    }

    if (notes) {
      const noteClient = tx.adminNote || prisma.adminNote;
      if (noteClient?.create) {
        await noteClient.create({
          data: {
            applicationId,
            adminId,
            note: notes,
          },
        });
      }
    }

    const auditClient = tx.auditLog || prisma.auditLog;
    if (auditClient?.create) {
      await auditClient.create({
        data: {
          action: `APPLICATION_${action}`,
          applicationId,
          adminId,
          previousStatus: existingApp.status,
          newStatus: nextStatus,
          reason: notes || null,
        },
      });
    }

    let notificationTitle = "";
    let notificationMessage = "";

    if (action === "APPROVE_SUPER_ADMIN") {
      notificationTitle = "Super Admin Role Granted! 🛡️";
      notificationMessage = `Congratulations! You have been granted Super Admin access for "${existingApp.organizationName || "your organization"}".`;
    } else if (action === "APPROVE") {
      notificationTitle = "Host Application Approved! 🎉";
      notificationMessage = `Congratulations! Your application for "${existingApp.organizationName || "your organization"}" has been approved. You can now host events.`;
    } else if (action === "REJECT") {
      notificationTitle = "Host Application Update";
      notificationMessage = `Your host application for "${existingApp.organizationName || "your organization"}" was not approved.${notes ? ` Reason: ${notes}` : ""}`;
    } else if (action === "REQUEST_INFO") {
      notificationTitle = "Action Required: Additional Info Needed";
      notificationMessage = `We need more details regarding your host application for "${existingApp.organizationName || "your organization"}".${notes ? ` Details: ${notes}` : ""}`;
    } else if (action === "SUSPEND") {
      notificationTitle = "Host Account Suspended";
      notificationMessage = `Your host status for "${existingApp.organizationName || "your organization"}" has been suspended.${notes ? ` Reason: ${notes}` : ""}`;
    } else if (action === "REINSTATE") {
      notificationTitle = "Host Account Reinstated";
      notificationMessage = `Your host status for "${existingApp.organizationName || "your organization"}" has been reinstated. You may now create and host events again.`;
    }

    if (notificationTitle && notificationMessage) {
      try {
        const notifClient = tx.notification || prisma.notification;
        if (notifClient?.create) {
          await notifClient.create({
            data: {
              userId: existingApp.userId,
              title: notificationTitle,
              message: notificationMessage,
            },
          });
        }
      } catch (err) {
        console.error("Failed to create notification:", err);
      }
    }

    return updated;
  });

  // Asynchronously dispatch transactional email
  if (existingApp.user?.email) {
    sendHostApplicationUpdateEmail({
      email: existingApp.user.email,
      name: existingApp.user.fullName || existingApp.user.name,
      organizationName: existingApp.organizationName,
      action,
      notes,
    }).catch((err) => console.error("Host notification email send failed:", err));
  }

  return updatedApp;
}
