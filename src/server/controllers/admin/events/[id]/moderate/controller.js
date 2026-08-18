import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";
import { createNotification } from "@/server/services/notificationService";
import { sendEventModerationEmail } from "@/server/services/emailService";
import { invalidateEventsCache } from "@/server/services/eventsCacheService";

export async function POST(request, { params }) {
  try {
    const admin = await requireSuperAdmin(request);
    const { id } = await params;
    const { action, reason } = await request.json();

    const VALID_ACTIONS = ["SUSPEND", "RESTORE", "ARCHIVE", "UNARCHIVE", "COMPLETE"];
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid moderation action" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, email: true, name: true, fullName: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let updatedStatus = event.status;
    let updatedArchived = event.archived;
    let auditAction = "";

    if (action === "SUSPEND") {
      updatedStatus = "Suspended";
      auditAction = "EVENT_SUSPENDED";
    } else if (action === "RESTORE") {
      updatedStatus = "Active";
      updatedArchived = false;
      auditAction = "EVENT_RESTORED";
    } else if (action === "ARCHIVE") {
      updatedArchived = true;
      auditAction = "EVENT_ARCHIVED";
    } else if (action === "UNARCHIVE") {
      updatedArchived = false;
      auditAction = "EVENT_UNARCHIVED";
    } else if (action === "COMPLETE") {
      updatedStatus = "Completed";
      auditAction = "EVENT_COMPLETED";
    }

    const updatedEvent = await prisma.$transaction(async (tx) => {
      const result = await tx.event.update({
        where: { id },
        data: {
          status: updatedStatus,
          archived: updatedArchived,
        },
      });

      const auditClient = tx.auditLog || prisma.auditLog;
      if (auditClient?.create) {
        await auditClient.create({
          data: {
            adminId: admin.id,
            action: auditAction,
            previousStatus: `${event.status} (Archived: ${event.archived})`,
            newStatus: `${updatedStatus} (Archived: ${updatedArchived})`,
            reason: reason ? `[Event: ${event.title} (${id})] ${reason}` : `Moderation action ${action} executed for event ${event.title} (${id})`,
          },
        });
      }

      return result;
    });

    // Automatic In-App Notification Trigger to Event Organizer
    if (event.organizerId) {
      await createNotification({
        userId: event.organizerId,
        title: "Event Moderation Update",
        message: `Your event "${event.title}" status has been updated to ${updatedStatus}${updatedArchived ? " (Archived)" : ""}.${reason ? ` Reason: ${reason}` : ""}`,
        type: "MODERATION",
      });
    }

    // Transactional Email to Event Organizer
    if (event.organizer?.email) {
      sendEventModerationEmail({
        email: event.organizer.email,
        name: event.organizer.fullName || event.organizer.name,
        eventTitle: event.title,
        action,
        reason,
      }).catch((err) => console.error("Event moderation email failed:", err));
    }

    invalidateEventsCache();

    return NextResponse.json({ success: true, data: updatedEvent });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("POST Admin Event Moderation Error:", error);
    return NextResponse.json({ error: "Failed to execute moderation action" }, { status: 500 });
  }
}
