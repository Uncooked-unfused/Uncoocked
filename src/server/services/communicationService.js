import { prisma } from "../db/prisma.js";
import { sendDirectCommunicationEmail } from "./emailService.js";

/**
 * Validates whether a string is a valid URL.
 */
function isValidUrl(string) {
  try {
    const parsed = new URL(string);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Resolves target user records based on targetType and targetGroup.
 */
async function resolveTargetUsers({ targetType, targetGroup, targetUserIds, customEmails }) {
  if (targetType === "INDIVIDUAL") {
    if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      return prisma.user.findMany({
        where: { id: { in: targetUserIds } },
        select: { id: true, email: true, name: true, role: true },
      });
    }
    if (Array.isArray(customEmails) && customEmails.length > 0) {
      return prisma.user.findMany({
        where: { email: { in: customEmails } },
        select: { id: true, email: true, name: true, role: true },
      });
    }
    throw new Error("No target users or emails specified for individual communication");
  }

  if (targetType === "GROUP") {
    switch (targetGroup) {
      case "ALL_USERS":
        return prisma.user.findMany({
          where: { email: { not: null } },
          select: { id: true, email: true, name: true, role: true },
        });

      case "ORGANIZERS":
        return prisma.user.findMany({
          where: {
            OR: [
              { role: { in: ["ORGANIZER", "ADMIN", "SUPER_ADMIN"] } },
              { organizedEvents: { some: {} } },
              { hostApplication: { status: "APPROVED" } },
            ],
            email: { not: null },
          },
          select: { id: true, email: true, name: true, role: true },
        });

      case "PENDING_HOSTS":
        return prisma.user.findMany({
          where: {
            hostApplication: {
              status: { in: ["PENDING", "UNDER_REVIEW", "NEEDS_MORE_INFORMATION"] },
            },
            email: { not: null },
          },
          select: { id: true, email: true, name: true, role: true },
        });

      case "VERIFIED_HOSTS":
        return prisma.user.findMany({
          where: {
            hostApplication: { status: "APPROVED" },
            email: { not: null },
          },
          select: { id: true, email: true, name: true, role: true },
        });

      case "ATTENDEES":
        return prisma.user.findMany({
          where: {
            registrations: { some: {} },
            email: { not: null },
          },
          select: { id: true, email: true, name: true, role: true },
        });

      default:
        throw new Error(`Unsupported target group: ${targetGroup}`);
    }
  }

  throw new Error(`Invalid target type: ${targetType}`);
}

/**
 * Dispatches an individual or group communication (Notification, Request Info, or Document/Media Request).
 */
export async function dispatchCommunication({
  adminId,
  subject,
  message,
  type = "NOTIFICATION",
  targetType = "INDIVIDUAL",
  targetGroup,
  targetUserIds,
  customEmails,
  requiredDocType,
  instructions,
  priority = "NORMAL",
  deadline,
  baseUrl = process.env.NEXTAUTH_URL || "https://uncooked.in",
}) {
  if (!adminId) throw new Error("Admin ID is required");
  if (!subject?.trim()) throw new Error("Subject is required");
  if (!message?.trim()) throw new Error("Message content is required");

  const isDocOrInfoRequest =
    type === "DOCUMENT_REQUEST" ||
    type === "MEDIA_REQUEST" ||
    type === "INFO_REQUEST" ||
    type === "REQUEST_INFO";

  if (isDocOrInfoRequest && !requiredDocType?.trim() && !subject?.trim()) {
    throw new Error("Required information/document subject is required for requests");
  }

  // 1. Resolve recipients
  const targetUsers = await resolveTargetUsers({ targetType, targetGroup, targetUserIds, customEmails });
  const validUsers = targetUsers.filter((u) => u.email && u.email.includes("@"));

  if (validUsers.length === 0) {
    throw new Error("No valid recipient users found with email addresses for this criteria");
  }

  const parsedDeadline = deadline ? new Date(deadline) : null;

  // 2. Create AdminCommunication record in DB
  const communication = await prisma.adminCommunication.create({
    data: {
      subject: subject.trim(),
      message: message.trim(),
      type,
      targetType,
      targetGroup: targetType === "GROUP" ? targetGroup : null,
      requiredDocType: isDocOrInfoRequest ? (requiredDocType?.trim() || subject.trim()) : null,
      instructions: instructions?.trim() || null,
      priority,
      deadline: parsedDeadline,
      sentBy: adminId,
    },
  });

  // 3. Create CommunicationRecipient rows
  const recipientRecords = await prisma.$transaction(
    validUsers.map((user) =>
      prisma.communicationRecipient.create({
        data: {
          communicationId: communication.id,
          userId: user.id,
          email: user.email.toLowerCase().trim(),
          status: "SENT",
        },
      })
    )
  );

  // 4. Create in-app Notifications for all recipients
  let notificationTitle;
  let notificationMessage;
  if (type === "INFO_REQUEST" || type === "REQUEST_INFO") {
    notificationTitle = `Action Required: Info Requested (${requiredDocType || subject})`;
    notificationMessage = `The admin team has requested information: "${requiredDocType || subject}". Click to submit your response.`;
  } else if (type === "DOCUMENT_REQUEST" || type === "MEDIA_REQUEST") {
    notificationTitle = `Action Required: Document/Media Request (${requiredDocType || subject})`;
    notificationMessage = `The administration team has requested documentation: "${requiredDocType || subject}". Click to view details and submit.`;
  } else {
    notificationTitle = `Administrative Notification: ${subject}`;
    notificationMessage = message.slice(0, 140) + (message.length > 140 ? "..." : "");
  }

  await prisma.notification.createMany({
    data: validUsers.map((user) => ({
      userId: user.id,
      title: notificationTitle,
      message: notificationMessage,
      type: isDocOrInfoRequest ? "DOCUMENT_REQUEST" : "SYSTEM",
    })),
  });

  // 5. Audit Log Entry
  if (prisma.auditLog?.create) {
    await prisma.auditLog.create({
      data: {
        adminId,
        action: "COMMUNICATION_DISPATCHED",
        newStatus: `${type} to ${validUsers.length} users`,
        reason: `Subject: "${subject.trim()}" | Target: ${targetType}${targetGroup ? ` (${targetGroup})` : ""}`,
      },
    });
  }

  // 6. Asynchronous Email Dispatch (non-blocking for fast response)
  const emailDispatches = recipientRecords.map(async (recipient) => {
    const user = validUsers.find((u) => u.id === recipient.userId);
    try {
      await sendDirectCommunicationEmail({
        email: recipient.email,
        name: user?.name || "Member",
        subject: communication.subject,
        message: communication.message,
        type: communication.type,
        requiredDocType: communication.requiredDocType,
        instructions: communication.instructions,
        priority: communication.priority,
        deadline: communication.deadline,
        requestId: recipient.id,
        baseUrl,
      });

      await prisma.communicationRecipient.update({
        where: { id: recipient.id },
        data: { status: "DELIVERED" },
      });
    } catch (err) {
      console.error(`Failed to dispatch email to ${recipient.email}:`, err);
    }
  });

  // Run in background / settled
  Promise.allSettled(emailDispatches).catch((err) => {
    console.error("Batch email dispatch background error:", err);
  });

  return {
    communicationId: communication.id,
    totalRecipients: validUsers.length,
    type,
    targetType,
  };
}

/**
 * Lists all sent communications with aggregate metrics.
 */
export async function listCommunications({ page = 1, limit = 20, type = "ALL", search = "" }) {
  const skip = (page - 1) * limit;

  const where = {
    ...(type !== "ALL" ? { type } : {}),
    ...(search
      ? {
          OR: [
            { subject: { contains: search, mode: "insensitive" } },
            { message: { contains: search, mode: "insensitive" } },
            { requiredDocType: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, totalCount] = await Promise.all([
    prisma.adminCommunication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        recipients: {
          select: {
            id: true,
            status: true,
            adminReviewStatus: true,
            respondedAt: true,
          },
        },
      },
    }),
    prisma.adminCommunication.count({ where }),
  ]);

  const formattedItems = items.map((comm) => {
    const totalRecipients = comm.recipients.length;
    const totalResponded = comm.recipients.filter((r) => r.status === "RESPONDED" || r.respondedAt !== null).length;
    const pendingReview = comm.recipients.filter(
      (r) => (r.status === "RESPONDED" || r.respondedAt !== null) && r.adminReviewStatus === "PENDING"
    ).length;
    const approvedCount = comm.recipients.filter((r) => r.adminReviewStatus === "APPROVED").length;

    return {
      id: comm.id,
      subject: comm.subject,
      message: comm.message,
      type: comm.type,
      targetType: comm.targetType,
      targetGroup: comm.targetGroup,
      requiredDocType: comm.requiredDocType,
      instructions: comm.instructions,
      priority: comm.priority,
      deadline: comm.deadline,
      sentBy: comm.sentBy,
      createdAt: comm.createdAt,
      stats: {
        totalRecipients,
        totalResponded,
        pendingReview,
        approvedCount,
        responseRate: totalRecipients > 0 ? Math.round((totalResponded / totalRecipients) * 100) : 0,
      },
    };
  });

  return {
    items: formattedItems,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
}

/**
 * Lists user submitted responses specifically for the Admin Panel.
 */
export async function listResponses({
  page = 1,
  limit = 25,
  communicationId,
  adminReviewStatus = "ALL",
  type = "ALL",
  search = "",
  onlyResponded = true,
}) {
  const skip = (page - 1) * limit;

  const where = {
    ...(communicationId ? { communicationId } : {}),
    ...(adminReviewStatus !== "ALL" ? { adminReviewStatus } : {}),
    ...(type !== "ALL"
      ? type === "INFO_REQUEST"
        ? { communication: { type: { in: ["INFO_REQUEST", "REQUEST_INFO"] } } }
        : { communication: { type } }
      : {}),
    ...(onlyResponded
      ? {
          OR: [
            { status: "RESPONDED" },
            { respondedAt: { not: null } },
            { documentUrl: { not: null } },
            { responseNotes: { not: null } },
          ],
        }
      : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { responseNotes: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { communication: { subject: { contains: search, mode: "insensitive" } } },
            { communication: { requiredDocType: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [responses, totalCount, statsCounts] = await Promise.all([
    prisma.communicationRecipient.findMany({
      where,
      orderBy: { respondedAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            clubAssociation: true,
            department: true,
          },
        },
        communication: {
          select: {
            id: true,
            subject: true,
            message: true,
            type: true,
            requiredDocType: true,
            instructions: true,
            priority: true,
            deadline: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.communicationRecipient.count({ where }),
    prisma.communicationRecipient.groupBy({
      by: ["adminReviewStatus"],
      where: onlyResponded
        ? {
            OR: [
              { status: "RESPONDED" },
              { respondedAt: { not: null } },
              { documentUrl: { not: null } },
              { responseNotes: { not: null } },
            ],
          }
        : {},
      _count: { id: true },
    }),
  ]);

  const reviewStats = {
    ALL: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    FOLLOW_UP_REQUIRED: 0,
    REVIEWED: 0,
  };

  for (const item of statsCounts) {
    if (reviewStats[item.adminReviewStatus] !== undefined) {
      reviewStats[item.adminReviewStatus] = item._count.id;
    }
    reviewStats.ALL += item._count.id;
  }

  return {
    items: responses,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    stats: reviewStats,
  };
}

/**
 * Updates admin review status and notes for a user response.
 */
export async function updateAdminReview({ recipientId, adminId, adminReviewStatus, adminReviewNotes }) {
  if (!recipientId) throw new Error("Recipient response ID is required");
  if (!adminId) throw new Error("Admin ID is required");

  const validStatuses = ["PENDING", "REVIEWED", "APPROVED", "REJECTED", "FOLLOW_UP_REQUIRED"];
  if (!validStatuses.includes(adminReviewStatus)) {
    throw new Error(`Invalid review status: ${adminReviewStatus}`);
  }

  const existing = await prisma.communicationRecipient.findUnique({
    where: { id: recipientId },
    include: {
      user: true,
      communication: true,
    },
  });

  if (!existing) {
    throw new Error("Response record not found");
  }

  const updated = await prisma.communicationRecipient.update({
    where: { id: recipientId },
    data: {
      adminReviewStatus,
      adminReviewNotes: adminReviewNotes?.trim() || null,
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      communication: true,
    },
  });

  // Create audit log
  if (prisma.auditLog?.create) {
    await prisma.auditLog.create({
      data: {
        adminId,
        action: "RESPONSE_REVIEWED",
        previousStatus: existing.adminReviewStatus,
        newStatus: adminReviewStatus,
        reason: `Response for "${existing.communication.subject}" updated to ${adminReviewStatus}. Notes: ${adminReviewNotes || "None"}`,
      },
    });
  }

  // If follow-up or status update, send user in-app notification
  if (prisma.notification?.create) {
    await prisma.notification.create({
      data: {
        userId: existing.userId,
        title: `Document Review Update: ${adminReviewStatus.replace(/_/g, " ")}`,
        message:
          adminReviewStatus === "APPROVED"
            ? `Your submitted documentation for "${existing.communication.requiredDocType || existing.communication.subject}" was approved.`
            : adminReviewStatus === "FOLLOW_UP_REQUIRED"
            ? `Follow-up required on your submission: "${adminReviewNotes || "Please review feedback and update details."}"`
            : `Review status updated for your submission regarding "${existing.communication.subject}".`,
        type: "SYSTEM",
      },
    });
  }

  return updated;
}

/**
 * Retrieves details of a specific request for a user.
 */
export async function getUserRequestDetails(recipientId, sessionUserId) {
  if (!recipientId) throw new Error("Request ID is required");

  const recipient = await prisma.communicationRecipient.findUnique({
    where: { id: recipientId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      communication: {
        select: {
          id: true,
          subject: true,
          message: true,
          type: true,
          requiredDocType: true,
          instructions: true,
          priority: true,
          deadline: true,
          createdAt: true,
        },
      },
    },
  });

  if (!recipient) {
    throw new Error("Request not found");
  }

  // Security guard: ensure user owns this recipient record or has admin role
  if (sessionUserId && recipient.userId !== sessionUserId) {
    const requestingUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { role: true },
    });
    if (requestingUser?.role !== "SUPER_ADMIN" && requestingUser?.role !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }
  }

  return recipient;
}

/**
 * Submits user response (document/media URL and explanation notes).
 */
export async function submitUserDocumentResponse({
  recipientId,
  sessionUserId,
  documentUrl,
  mediaUrls,
  responseNotes,
}) {
  if (!recipientId) throw new Error("Request ID is required");

  const recipient = await prisma.communicationRecipient.findUnique({
    where: { id: recipientId },
    include: { communication: true },
  });

  if (!recipient) {
    throw new Error("Request not found");
  }

  if (sessionUserId && recipient.userId !== sessionUserId) {
    throw new Error("UNAUTHORIZED");
  }

  if (!documentUrl?.trim() && !responseNotes?.trim()) {
    throw new Error("Please provide either a valid document URL or detailed response notes");
  }

  if (documentUrl?.trim() && !isValidUrl(documentUrl.trim())) {
    throw new Error("Please provide a valid URL for your document/media link (e.g., https://drive.google.com/...)");
  }

  let formattedMediaUrls = null;
  if (mediaUrls) {
    if (typeof mediaUrls === "string") {
      formattedMediaUrls = mediaUrls.trim();
    } else if (Array.isArray(mediaUrls)) {
      formattedMediaUrls = JSON.stringify(mediaUrls);
    }
  }

  const updated = await prisma.communicationRecipient.update({
    where: { id: recipientId },
    data: {
      status: "RESPONDED",
      respondedAt: new Date(),
      documentUrl: documentUrl?.trim() || null,
      mediaUrls: formattedMediaUrls,
      responseNotes: responseNotes?.trim() || null,
      adminReviewStatus: "PENDING", // Reset to pending review on new submission
    },
    include: {
      communication: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return updated;
}
