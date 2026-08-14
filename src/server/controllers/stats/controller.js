import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  try {
    const [studentsCount, activeEventsCount, registrationsCount, clubsGroup, approvedOrgs, departmentGroup] = await Promise.all([
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
    ]);

    const clubNames = new Set([
      ...clubsGroup.map((g) => g.clubAssociation?.trim()).filter(Boolean),
      ...approvedOrgs.map((o) => o.organizationName?.trim()).filter(Boolean),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        students: studentsCount,
        activeEvents: activeEventsCount,
        registrations: registrationsCount,
        clubs: clubNames.size,
        departments: departmentGroup.map((d) => ({
          name: d.department,
          count: d._count.department,
        })),
      },
    });
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
