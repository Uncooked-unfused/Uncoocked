import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";
import { createNotification } from "@/server/services/notificationService";
import { sendUserRoleUpdatedEmail } from "@/server/services/emailService";

export async function POST(request, { params }) {
  try {
    const admin = await requireSuperAdmin(request);
    const { id } = await params;
    const { newRole, reason } = await request.json();

    const rawRole = (newRole || "").toUpperCase().replace("-", "_");
    let formattedRole = rawRole;
    if (rawRole === "SUPERADMIN") formattedRole = "SUPER_ADMIN";

    if (!formattedRole || !["USER", "ORGANIZER", "SUPER_ADMIN"].includes(formattedRole)) {
      return NextResponse.json({ error: "Invalid role specified. Must be USER, ORGANIZER, or SUPER_ADMIN" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { hostApplication: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const previousRole = targetUser.role;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { role: formattedRole },
      });

      const auditClient = tx.auditLog || prisma.auditLog;
      if (auditClient?.create) {
        await auditClient.create({
          data: {
            adminId: admin.id,
            applicationId: targetUser.hostApplication?.id || null,
            action: "USER_ROLE_UPDATED",
            previousStatus: previousRole,
            newStatus: formattedRole,
            reason: reason || `User role updated from ${previousRole} to ${formattedRole}`,
          },
        });
      }

      return user;
    });

    // In-App Notification
    await createNotification({
      userId: id,
      title: "Account Role Updated",
      message: `Your account role has been updated from ${previousRole} to ${formattedRole}.${reason ? ` Reason: ${reason}` : ""}`,
      type: "GOVERNANCE",
    });

    // Transactional Email
    if (targetUser.email) {
      sendUserRoleUpdatedEmail({
        email: targetUser.email,
        name: targetUser.name || targetUser.fullName,
        oldRole: previousRole,
        newRole: formattedRole,
        reason,
      }).catch((err) => console.error("Role update email failed:", err));
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("POST User Role Update Error:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
