import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";

let analyticsCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds

export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const nowTimestamp = Date.now();
    if (analyticsCache && nowTimestamp - lastCacheTime < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: analyticsCache,
      });
    }

    const now = new Date();

    const [
      totalUsers,
      totalOrganizers,
      totalAdmins,
      suspendedUsers,
      totalApplications,
      pendingApps,
      underReviewApps,
      approvedApps,
      rejectedApps,
      needsInfoApps,
      suspendedApps,
      totalEvents,
      activeEvents,
      upcomingEvents,
      completedEvents,
      archivedEvents,
      suspendedEvents,
      totalRegistrations,
      recentAuditCount,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { role: "ORGANIZER" } }).catch(() => 0),
      prisma.user.count({ where: { role: "SUPER_ADMIN" } }).catch(() => 0),
      prisma.user.count({ where: { lockedUntil: { gte: now } } }).catch(() => 0),
      prisma.hostApplication.count().catch(() => 0),
      prisma.hostApplication.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.hostApplication.count({ where: { status: "UNDER_REVIEW" } }).catch(() => 0),
      prisma.hostApplication.count({ where: { status: "APPROVED" } }).catch(() => 0),
      prisma.hostApplication.count({ where: { status: "REJECTED" } }).catch(() => 0),
      prisma.hostApplication.count({ where: { status: "NEEDS_MORE_INFORMATION" } }).catch(() => 0),
      prisma.hostApplication.count({ where: { status: "SUSPENDED" } }).catch(() => 0),
      prisma.event.count().catch(() => 0),
      prisma.event.count({ where: { status: "Active", archived: false } }).catch(() => 0),
      prisma.event.count({ where: { date: { gte: now }, archived: false } }).catch(() => 0),
      prisma.event.count({ where: { OR: [{ status: "Completed" }, { date: { lt: now } }] } }).catch(() => 0),
      prisma.event.count({ where: { archived: true } }).catch(() => 0),
      prisma.event.count({ where: { status: "Suspended" } }).catch(() => 0),
      prisma.registration.count().catch(() => 0),
      prisma.auditLog.count().catch(() => 0),
    ]);

    const standardUsers = totalUsers - totalOrganizers - totalAdmins;
    const approvalRate = totalApplications > 0 ? parseFloat(((approvedApps / totalApplications) * 100).toFixed(1)) : 0;
    const rejectionRate = totalApplications > 0 ? parseFloat(((rejectedApps / totalApplications) * 100).toFixed(1)) : 0;
    const verificationQueueSize = pendingApps + underReviewApps + needsInfoApps;

    const data = {
      users: {
        totalUsers,
        standardUsers: Math.max(0, standardUsers),
        organizers: totalOrganizers,
        superAdmins: totalAdmins,
        suspendedUsers,
      },
      applications: {
        totalApplications,
        pendingApps,
        underReviewApps,
        approvedApps,
        rejectedApps,
        needsInfoApps,
        suspendedApps,
        approvalRate,
        rejectionRate,
        verificationQueueSize,
      },
      events: {
        totalEvents,
        activeEvents,
        upcomingEvents,
        completedEvents,
        archivedEvents,
        suspendedEvents,
        totalRegistrations,
      },
      system: {
        recentAuditCount,
      },
    };

    analyticsCache = data;
    lastCacheTime = nowTimestamp;

    return NextResponse.json({
      success: true,
      cached: false,
      data,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("GET Analytics Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
