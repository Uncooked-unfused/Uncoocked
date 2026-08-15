import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";
import { getSystemHealthStatus } from "@/server/services/systemMonitoringService";

let statsCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 20_000; // 20-second in-memory TTL for instant subsequent dashboard loads

export function invalidateAdminStatsCache() {
  statsCache = null;
  lastCacheTime = 0;
}

export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const bypassCache = searchParams.get("refresh") === "true";
    const nowTimestamp = Date.now();

    if (!bypassCache && statsCache && nowTimestamp - lastCacheTime < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        cached: true,
        ...statsCache,
      });
    }

    const now = new Date();

    const [
      statusGroups,
      userGroups,
      activeEvents,
      upcomingEvents,
      completedEvents,
      recentActivity,
      pendingWorkItems,
      activeIncidentsCount,
      systemHealth,
      reviewStats,
    ] = await Promise.all([
      prisma.hostApplication.groupBy({
        by: ["status"],
        _count: { _all: true },
      }).catch(() => []),
      prisma.user.groupBy({
        by: ["role"],
        _count: { _all: true },
      }).catch(() => []),
      prisma.event.count({ where: { status: "Active", archived: false } }).catch(() => 0),
      prisma.event.count({ where: { date: { gte: now }, archived: false } }).catch(() => 0),
      prisma.event.count({ where: { OR: [{ status: "Completed" }, { date: { lt: now } }] } }).catch(() => 0),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { timestamp: "desc" },
        include: {
          application: {
            select: {
              organizationName: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      }).catch(() => []),
      prisma.hostApplication.findMany({
        where: {
          status: { in: ["PENDING", "UNDER_REVIEW", "NEEDS_MORE_INFORMATION", "SUSPENDED"] },
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { id: true, name: true, fullName: true, email: true } },
        },
      }).catch(() => []),
      prisma.platformIncident.count({
        where: { status: { in: ["INVESTIGATING", "IDENTIFIED", "MONITORING"] } },
      }).catch(() => 0),
      getSystemHealthStatus().catch(() => null),
      prisma.review.aggregate({
        _avg: { rating: true },
        _count: { _all: true },
      }).catch(() => ({ _avg: { rating: 0 }, _count: { _all: 0 } })),
    ]);

    // Parse host application status groups & compute total
    let totalApplications = 0;
    const statusMap = {};
    if (Array.isArray(statusGroups)) {
      for (const item of statusGroups) {
        if (item && item.status) {
          const count = item._count?._all ?? item._count?.status ?? (typeof item._count === "number" ? item._count : 0);
          statusMap[item.status] = count;
          totalApplications += count;
        }
      }
    }

    // Parse user roles & compute total users + organizers
    let totalUsers = 0;
    let totalOrganizers = 0;
    if (Array.isArray(userGroups)) {
      for (const item of userGroups) {
        if (item) {
          const count = item._count?._all ?? item._count?.role ?? (typeof item._count === "number" ? item._count : 0);
          totalUsers += count;
          const roleUpper = (item.role || "").toUpperCase();
          if (roleUpper === "ORGANIZER" || roleUpper === "SUPER_ADMIN" || roleUpper === "ADMIN") {
            totalOrganizers += count;
          }
        }
      }
    }

    const totalReviews = reviewStats?._count?._all ?? 0;
    const avgRating = reviewStats?._avg?.rating ? reviewStats._avg.rating.toFixed(1) : "0.0";

    const pendingCount = statusMap["PENDING"] || 0;
    const underReviewCount = statusMap["UNDER_REVIEW"] || 0;
    const approvedCount = statusMap["APPROVED"] || 0;
    const rejectedCount = statusMap["REJECTED"] || 0;
    const needsInfoCount = statusMap["NEEDS_MORE_INFORMATION"] || 0;
    const suspendedCount = statusMap["SUSPENDED"] || 0;

    const approvalRate = totalApplications > 0 ? ((approvedCount / totalApplications) * 100).toFixed(1) : "0.0";
    const rejectionRate = totalApplications > 0 ? ((rejectedCount / totalApplications) * 100).toFixed(1) : "0.0";
    const verificationQueueSize = pendingCount + underReviewCount + needsInfoCount;

    const responseData = {
      stats: {
        totalApplications,
        pendingCount,
        underReviewCount,
        approvedCount,
        rejectedCount,
        needsInfoCount,
        suspendedCount,
        totalUsers,
        totalOrganizers,
        activeEvents: activeEvents || 0,
        upcomingEvents: upcomingEvents || 0,
        completedEvents: completedEvents || 0,
        totalReviews,
        avgRating,
        approvalRate,
        rejectionRate,
        verificationQueueSize,
        activeIncidentsCount: activeIncidentsCount || 0,
        systemHealth,
      },
      recentActivity: recentActivity || [],
      pendingWorkItems: pendingWorkItems || [],
    };

    statsCache = responseData;
    lastCacheTime = nowTimestamp;

    return NextResponse.json({
      success: true,
      cached: false,
      ...responseData,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN_PERMISSION") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Super Admin Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
