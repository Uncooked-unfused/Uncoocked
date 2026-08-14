import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";
import { getSystemHealthStatus } from "@/server/services/systemMonitoringService";

export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const now = new Date();

    const [
      totalApplications,
      statusGroups,
      totalUsers,
      totalOrganizers,
      activeEvents,
      upcomingEvents,
      completedEvents,
      recentActivity,
      pendingWorkItems,
      activeIncidentsCount,
      systemHealth,
      allReviews,
    ] = await Promise.all([
      prisma.hostApplication.count().catch(() => 0),
      prisma.hostApplication.groupBy({
        by: ["status"],
        _count: { _all: true },
      }).catch(() => []),
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { role: { in: ["ORGANIZER", "SUPER_ADMIN", "Organizer"] } } }).catch(() => 0),
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
      prisma.review.findMany({ select: { rating: true } }).catch(() => []),
    ]);

    const totalReviews = (allReviews || []).length;
    const avgRating =
      totalReviews > 0
        ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1)
        : "0.0";

    const statusMap = Array.isArray(statusGroups)
      ? statusGroups.reduce((acc, curr) => {
          if (curr && curr.status) {
            const count = curr._count?._all ?? curr._count?.status ?? (typeof curr._count === "number" ? curr._count : 0);
            acc[curr.status] = count;
          }
          return acc;
        }, {})
      : {};

    const pendingCount = statusMap["PENDING"] || 0;
    const underReviewCount = statusMap["UNDER_REVIEW"] || 0;
    const approvedCount = statusMap["APPROVED"] || 0;
    const rejectedCount = statusMap["REJECTED"] || 0;
    const needsInfoCount = statusMap["NEEDS_MORE_INFORMATION"] || 0;
    const suspendedCount = statusMap["SUSPENDED"] || 0;

    const approvalRate = totalApplications > 0 ? ((approvedCount / totalApplications) * 100).toFixed(1) : "0.0";
    const rejectionRate = totalApplications > 0 ? ((rejectedCount / totalApplications) * 100).toFixed(1) : "0.0";
    const verificationQueueSize = pendingCount + underReviewCount + needsInfoCount;

    return NextResponse.json({
      success: true,
      stats: {
        totalApplications: totalApplications || 0,
        pendingCount,
        underReviewCount,
        approvedCount,
        rejectedCount,
        needsInfoCount,
        suspendedCount,
        totalUsers: totalUsers || 0,
        totalOrganizers: totalOrganizers || 0,
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
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN_PERMISSION") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Super Admin Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
