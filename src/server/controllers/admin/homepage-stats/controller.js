import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";
import { getSystemSetting, setSystemSetting } from "@/server/services/systemSettingsService";
import { invalidateAdminStatsCache } from "@/server/controllers/admin/stats/controller";

async function getLivePlatformStats() {
  const [
    studentsCount,
    activeEventsCount,
    registrationsCount,
    clubsGroup,
    approvedOrgs,
    eventsWithCustomCount,
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
    prisma.event.findMany({
      where: { customRegistrationCount: { not: null } },
      select: {
        id: true,
        customRegistrationCount: true,
        _count: { select: { registrations: true } },
      },
    }),
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

  return {
    students: studentsCount,
    activeEvents: activeEventsCount,
    registrations: totalEffectiveRegistrations,
    rawRegistrations: registrationsCount,
    clubs: clubNames.size,
  };
}

export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const [
      actualStats,
      statsMode,
      customStudents,
      customEvents,
      customRegistrations,
      customClubs,
    ] = await Promise.all([
      getLivePlatformStats(),
      getSystemSetting("HOMEPAGE_STATS_MODE", "CUSTOM"),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_STUDENTS", 6846),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_EVENTS", 8),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_REGISTRATIONS", 2346),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_CLUBS", 12),
    ]);

    const customStats = {
      students: Number(customStudents) || 6846,
      activeEvents: Number(customEvents) || 8,
      registrations: Number(customRegistrations) || 2346,
      clubs: Number(customClubs) || 12,
    };

    const isActual = statsMode === "ACTUAL";
    const activeStats = isActual ? actualStats : customStats;

    return NextResponse.json({
      success: true,
      mode: isActual ? "ACTUAL" : "CUSTOM",
      actualStats,
      customStats,
      activeStats,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN_PERMISSION") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Homepage Stats API GET error:", error);
    return NextResponse.json({ error: "Failed to fetch homepage stats configuration" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    const body = await request.json();
    const { mode, customStats } = body;

    // Validate mode if provided
    if (mode !== undefined && mode !== "ACTUAL" && mode !== "CUSTOM") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'ACTUAL' or 'CUSTOM'." },
        { status: 400 }
      );
    }

    if (mode) {
      await setSystemSetting(
        "HOMEPAGE_STATS_MODE",
        mode,
        admin.id,
        "STRING",
        "Homepage stats display mode (ACTUAL database metrics or CUSTOM tweaked numbers)",
        `Mode switched to ${mode}`
      );
    }

    // Validate and update custom stats if provided
    if (customStats && typeof customStats === "object") {
      const keysConfig = [
        { key: "HOMEPAGE_STATS_CUSTOM_STUDENTS", field: "students", label: "Students count" },
        { key: "HOMEPAGE_STATS_CUSTOM_EVENTS", field: "activeEvents", label: "Active events count" },
        { key: "HOMEPAGE_STATS_CUSTOM_REGISTRATIONS", field: "registrations", label: "Registrations count" },
        { key: "HOMEPAGE_STATS_CUSTOM_CLUBS", field: "clubs", label: "Clubs count" },
      ];

      for (const item of keysConfig) {
        if (customStats[item.field] !== undefined && customStats[item.field] !== null) {
          const val = parseInt(customStats[item.field], 10);
          if (isNaN(val) || val < 0 || val > 10_000_000) {
            return NextResponse.json(
              { error: `Invalid ${item.field} count. Must be a non-negative number up to 10,000,000.` },
              { status: 400 }
            );
          }
          await setSystemSetting(
            item.key,
            val,
            admin.id,
            "NUMBER",
            `Homepage custom metric: ${item.label}`,
            `Custom ${item.field} set to ${val}`
          );
        }
      }
    }

    invalidateAdminStatsCache();

    // Fetch refreshed values
    const [
      actualStats,
      updatedMode,
      updatedStudents,
      updatedEvents,
      updatedRegistrations,
      updatedClubs,
    ] = await Promise.all([
      getLivePlatformStats(),
      getSystemSetting("HOMEPAGE_STATS_MODE", "CUSTOM"),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_STUDENTS", 6846),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_EVENTS", 8),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_REGISTRATIONS", 2346),
      getSystemSetting("HOMEPAGE_STATS_CUSTOM_CLUBS", 12),
    ]);

    const updatedCustomStats = {
      students: Number(updatedStudents) || 6846,
      activeEvents: Number(updatedEvents) || 8,
      registrations: Number(updatedRegistrations) || 2346,
      clubs: Number(updatedClubs) || 12,
    };

    const isActual = updatedMode === "ACTUAL";
    const activeStats = isActual ? actualStats : updatedCustomStats;

    return NextResponse.json({
      success: true,
      mode: isActual ? "ACTUAL" : "CUSTOM",
      actualStats,
      customStats: updatedCustomStats,
      activeStats,
      message:
        mode === "ACTUAL"
          ? "Homepage metrics successfully switched to live database counts."
          : "Homepage metrics updated and configured successfully.",
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN_PERMISSION") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Homepage Stats API POST error:", error);
    return NextResponse.json({ error: "Failed to update homepage stats configuration" }, { status: 500 });
  }
}
