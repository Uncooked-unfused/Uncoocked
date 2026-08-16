import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";

let analyticsCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 20_000; // 20 seconds

export function invalidateAnalyticsCache() {
  analyticsCache = null;
  lastCacheTime = 0;
}

export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const bypassCache = searchParams.get("refresh") === "true";
    const nowTimestamp = Date.now();

    if (!bypassCache && analyticsCache && nowTimestamp - lastCacheTime < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: analyticsCache,
      });
    }

    const now = new Date();

    const [
      userRoleGroups,
      suspendedUsers,
      appStatusGroups,
      eventStatusGroups,
      upcomingEvents,
      totalRegistrations,
      recentAuditCount,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }).catch(() => []),
      prisma.user.count({ where: { lockedUntil: { gte: now } } }).catch(() => 0),
      prisma.hostApplication.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
      prisma.event.groupBy({ by: ["status", "archived"], _count: { _all: true } }).catch(() => []),
      prisma.event.count({ where: { date: { gte: now }, archived: false } }).catch(() => 0),
      prisma.registration.count().catch(() => 0),
      prisma.auditLog.count().catch(() => 0),
    ]);

    // Parse user roles
    let totalUsers = 0;
    let organizers = 0;
    let superAdmins = 0;
    let standardUsers = 0;
    if (Array.isArray(userRoleGroups)) {
      for (const item of userRoleGroups) {
        const count = item._count?._all || 0;
        totalUsers += count;
        const roleUpper = (item.role || "").toUpperCase();
        if (roleUpper === "ORGANIZER") organizers += count;
        else if (roleUpper === "SUPER_ADMIN" || roleUpper === "ADMIN") superAdmins += count;
        else standardUsers += count;
      }
    }

    // Parse application statuses
    let totalApplications = 0;
    let pendingApps = 0;
    let underReviewApps = 0;
    let approvedApps = 0;
    let rejectedApps = 0;
    let needsInfoApps = 0;
    let suspendedApps = 0;
    if (Array.isArray(appStatusGroups)) {
      for (const item of appStatusGroups) {
        const count = item._count?._all || 0;
        totalApplications += count;
        if (item.status === "PENDING") pendingApps += count;
        else if (item.status === "UNDER_REVIEW") underReviewApps += count;
        else if (item.status === "APPROVED") approvedApps += count;
        else if (item.status === "REJECTED") rejectedApps += count;
        else if (item.status === "NEEDS_MORE_INFORMATION") needsInfoApps += count;
        else if (item.status === "SUSPENDED") suspendedApps += count;
      }
    }

    const approvalRate = totalApplications > 0 ? parseFloat(((approvedApps / totalApplications) * 100).toFixed(1)) : 0;
    const rejectionRate = totalApplications > 0 ? parseFloat(((rejectedApps / totalApplications) * 100).toFixed(1)) : 0;
    const verificationQueueSize = pendingApps + underReviewApps + needsInfoApps;

    // Parse event statuses
    let totalEvents = 0;
    let activeEvents = 0;
    let completedEvents = 0;
    let archivedEvents = 0;
    let suspendedEvents = 0;
    if (Array.isArray(eventStatusGroups)) {
      for (const item of eventStatusGroups) {
        const count = item._count?._all || 0;
        totalEvents += count;
        if (item.archived) archivedEvents += count;
        if (item.status === "Active" && !item.archived) activeEvents += count;
        if (item.status === "Completed") completedEvents += count;
        if (item.status === "Suspended") suspendedEvents += count;
      }
    }

    const data = {
      users: {
        totalUsers,
        standardUsers: Math.max(0, standardUsers),
        organizers,
        superAdmins,
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
