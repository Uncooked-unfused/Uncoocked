import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";

export async function GET(request) {
  try {
    // Verify Super Admin access
    await requireSuperAdmin(request);

    // Group application counts by status in a single query
    const statusCounts = await prisma.hostApplication.groupBy({
      by: ["status"],
      _count: { _all: true },
    }).catch(() => []);

    const stats = {
      PENDING: 0,
      UNDER_REVIEW: 0,
      NEEDS_MORE_INFORMATION: 0,
      APPROVED: 0,
      REJECTED: 0,
      SUSPENDED: 0,
    };

    if (Array.isArray(statusCounts)) {
      statusCounts.forEach((item) => {
        if (item && item.status) {
          stats[item.status] = item._count?._all ?? item._count?.status ?? (typeof item._count === "number" ? item._count : 0);
        }
      });
    }

    return NextResponse.json({ success: true, data: stats }, { status: 200 });
  } catch (error) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN_PERMISSION") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("Super Admin Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
