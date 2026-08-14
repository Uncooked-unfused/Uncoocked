import { prisma } from "../db/prisma.js";
import { getSystemHealthStatus } from "./systemMonitoringService.js";
import { getActiveIncidents } from "./platformIncidentService.js";

export async function createTicket(ticketData, userId) {
  const { subject, category, priority, message, eventId, hostAppId } = ticketData;
  if (!subject || !category || !message) {
    throw new Error("Subject, category, and message are required");
  }

  return prisma.$transaction(async (tx) => {
    const ticketClient = tx.supportTicket || prisma.supportTicket;
    const ticket = await ticketClient.create({
      data: {
        subject: subject.trim(),
        category,
        priority: priority || "MEDIUM",
        userId,
        eventId: eventId || null,
        hostAppId: hostAppId || null,
      },
    });

    const msgClient = tx.ticketMessage || prisma.ticketMessage;
    if (msgClient?.create) {
      await msgClient.create({
        data: {
          ticketId: ticket.id,
          senderId: userId,
          content: message.trim(),
          isInternal: false,
        },
      });
    }

    return ticket;
  });
}

export async function getTickets(filters = {}) {
  const { status, category, priority, userId, limit = 50 } = filters;
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;
  if (userId) where.userId = userId;

  return prisma.supportTicket.findMany({
    where,
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, fullName: true, email: true, role: true } },
      _count: { select: { messages: true } },
    },
  });
}

export async function getTicketDetails(ticketId) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          fullName: true,
          email: true,
          role: true,
          lockedUntil: true,
          failedLoginAttempts: true,
          createdAt: true,
          hostApplication: {
            select: { id: true, organizationName: true, status: true, kycStatus: true },
          },
          registrations: {
            take: 5,
            orderBy: { registeredAt: "desc" },
            select: {
              id: true,
              status: true,
              registeredAt: true,
              event: {
                select: { id: true, title: true, date: true, status: true, city: true },
              },
            },
          },
        },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) return null;

  // Enrich support ticket view with live operational observability context
  const systemHealth = await getSystemHealthStatus();
  const incidents = await getActiveIncidents();

  return {
    ticket,
    observabilityContext: {
      systemHealth,
      activeIncidents: incidents.incidents,
    },
  };
}

export async function addTicketMessage(ticketId, senderId, content, isInternal = false) {
  if (!content?.trim()) throw new Error("Message content cannot be empty");

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Support ticket not found");

  return prisma.$transaction(async (tx) => {
    const message = await tx.ticketMessage.create({
      data: {
        ticketId,
        senderId,
        content: content.trim(),
        isInternal: Boolean(isInternal),
      },
    });

    await tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: isInternal ? ticket.status : "WAITING_ON_USER",
        updatedAt: new Date(),
      },
    });

    return message;
  });
}

export async function updateTicketStatus(ticketId, status, adminId, reason = null) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Support ticket not found");

  const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_ON_USER", "RESOLVED", "CLOSED"];
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid ticket status: ${status}`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.supportTicket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() },
    });

    const auditClient = tx.auditLog || prisma.auditLog;
    if (auditClient?.create) {
      await auditClient.create({
        data: {
          adminId,
          action: "SUPPORT_TICKET_STATUS_UPDATED",
          previousStatus: ticket.status,
          newStatus: status,
          reason: reason || `Support ticket #${ticketId} status changed to ${status}`,
        },
      });
    }

    return updated;
  });
}
