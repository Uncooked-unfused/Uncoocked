import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";
import { withAdminRateLimit } from "@/server/middleware/rateLimit";
import { createNotification } from "@/server/services/notificationService";
import { sendEventModerationEmail } from "@/server/services/emailService";

export const POST = withAdminRateLimit(async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    const { eventIds, action, reason } = await request.json();

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ error: "Missing or empty eventIds array" }, { status: 400 });
    }

    if (!["SUSPEND", "RESTORE", "ARCHIVE"].includes(action)) {
      return NextResponse.json({ error: "Invalid batch moderation action" }, { status: 400 });
    }

    const processed = [];
    const errors = [];

    for (const id of eventIds) {
      try {
        const event = await prisma.event.findUnique({
          where: { id },
          include: {
            organizer: {
              select: { id: true, email: true, name: true, fullName: true },
            },
          },
        });
        if (!event) continue;

        let updatedStatus = event.status;
        let updatedArchived = event.archived;
        let auditAction = "";

        if (action === "SUSPEND") {
          updatedStatus = "Suspended";
          auditAction = "EVENT_BULK_SUSPENDED";
        } else if (action === "RESTORE") {
          updatedStatus = "Active";
          updatedArchived = false;
          auditAction = "EVENT_BULK_RESTORED";
        } else if (action === "ARCHIVE") {
          updatedArchived = true;
          auditAction = "EVENT_BULK_ARCHIVED";
        }

        await prisma.$transaction([
          prisma.event.update({
            where: { id },
            data: { status: updatedStatus, archived: updatedArchived },
          }),
          prisma.auditLog.create({
            data: {
              adminId: admin.id,
              action: auditAction,
              previousStatus: event.status,
              newStatus: updatedStatus,
              reason: reason ? `[Bulk Event Action: ${id}] ${reason}` : `Bulk ${action} executed for event ${id}`,
            },
          }),
        ]);

        if (event.organizerId) {
          await createNotification({
            userId: event.organizerId,
            title: "Event Moderation Update",
            message: `Your event "${event.title}" status has been updated to ${updatedStatus}${updatedArchived ? " (Archived)" : ""}.${reason ? ` Reason: ${reason}` : ""}`,
            type: "MODERATION",
          }).catch(() => null);

          if (event.organizer?.email) {
            sendEventModerationEmail({
              email: event.organizer.email,
              name: event.organizer.fullName || event.organizer.name,
              eventTitle: event.title,
              action,
              reason,
            }).catch((err) => console.error("Bulk event moderation email failed:", err));
          }
        }

        processed.push(id);
      } catch (err) {
        errors.push({ id, error: err.message });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      processedCount: processed.length,
      failedCount: errors.length,
      processed,
      errors,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("POST Batch Event Moderation Error:", error);
    return NextResponse.json({ error: "Batch event moderation failed" }, { status: 500 });
  }
});
