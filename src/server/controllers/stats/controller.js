import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSystemSetting } from "@/server/services/systemSettingsService";

export async function GET() {
  try {
    const [
      studentsCount,
      activeEventsCount,
      registrationsCount,
      clubsGroup,
      approvedOrgs,
      departmentGroup,
      eventsWithCustomCount,
      statsMode,
      customStudents,
      customEvents,
      customRegistrations,
      customClubs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count({ where: { status: "Active", archived: false } }),
      prisma.registration.count(),
      prisma.user.groupBy({
        by: ["clubAssociation"],
        where: { clubAssociation: { not: null } },
      }),
      prisma.hostApplication.findMany({
        where: { status: { in: ["APPROVED", "PENDING"] } },
        select: { organizationName: true },
      }),
      prisma.user.groupBy({
        by: ["department"],
        _count: { department: true },
        where: { department: { not: null } },
      }),
      prisma.event.findMany({
        where: { customRegistrationCount: { not: null } },
        select: {
          id: true,
          customRegistrationCount: true,
          _count: { select: { registrations: true } },
        },
      }),
      getSystemSetting("HOMEPAGE_STATS_MODE", "CUSTOM"),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_STUDENTS", 6846),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_EVENTS", 8),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_REGISTRATIONS", 2346),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_CLUBS", 12),
    ]);

    let customRegistrationsDelta = 0;
    for (const ev of eventsWithCustomCount) {
      if (ev.customRegistrationCount !== null && ev.customRegistrationCount !== undefined) {
        customRegistrationsDelta += ev.customRegistrationCount - (ev._count?.registrations || 0);
      }
    }
    const totalEffectiveRegistrations = Math.max(0, registrationsCount + customRegistrationsDelta);

    const clubNames = new Set([
      ...clubsGroup.map((g) => g.clubAssociation?.trim()).filter(Boolean),
      ...approvedOrgs.map((o) => o.organizationName?.trim()).filter(Boolean),
    ]);

    const actualStats = {
      students: studentsCount,
      activeEvents: activeEventsCount,
      registrations: totalEffectiveRegistrations,
      clubs: clubNames.size,
    };

    const parsedCustomStats = {
      students: Number(customStudents) || 6846,
      activeEvents: Number(customEvents) || 8,
      registrations: Number(customRegistrations) || 2346,
      clubs: Number(customClubs) || 12,
    };

    const isActual = statsMode === "ACTUAL";
    const activeStats = isActual ? actualStats : parsedCustomStats;

    return NextResponse.json(
      {
        success: true,
        mode: isActual ? "ACTUAL" : "CUSTOM",
        stats: {
          students: activeStats.students,
          activeEvents: activeStats.activeEvents,
          registrations: activeStats.registrations,
          clubs: activeStats.clubs,
          departments: departmentGroup.map((d) => ({
            name: d.department,
            count: d._count.department,
          })),
        },
        actualStats,
        customStats: parsedCustomStats,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stats",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
