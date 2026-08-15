import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";

export const runtime = "nodejs";

// GET /api/admin/opportunities - Fetch all opportunities with filters and summary KPIs
export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const type = searchParams.get("type") || "ALL";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where = {
      ...(status !== "ALL" ? { status } : {}),
      ...(type !== "ALL" ? { type } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { company: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [opportunities, totalFiltered, allStats, applicationStats] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: {
          _count: {
            select: { applications: true },
          },
        },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.opportunity.count({ where }),
      prisma.opportunity.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.opportunityApplication.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    // Parse status breakdown
    let totalCount = 0;
    let activeCount = 0;
    let pausedCount = 0;
    let closedCount = 0;

    for (const stat of allStats) {
      const count = stat._count._all;
      totalCount += count;
      if (stat.status === "ACTIVE") activeCount = count;
      else if (stat.status === "PAUSED") pausedCount = count;
      else if (stat.status === "CLOSED") closedCount = count;
    }

    let totalApplicationsCount = 0;
    let pendingApplicationsCount = 0;

    for (const appStat of applicationStats) {
      const count = appStat._count._all;
      totalApplicationsCount += count;
      if (appStat.status === "PENDING") pendingApplicationsCount = count;
    }

    const parsedItems = opportunities.map((opp) => {
      let tags = [];
      try {
        tags = JSON.parse(opp.tags);
      } catch {
        tags = opp.tags ? opp.tags.split(",").map((t) => t.trim()) : [];
      }
      return {
        ...opp,
        tags,
        applicationsCount: opp._count.applications,
      };
    });

    return NextResponse.json({
      success: true,
      items: parsedItems,
      total: totalFiltered,
      page,
      limit,
      stats: {
        totalCount,
        activeCount,
        pausedCount,
        closedCount,
        totalApplicationsCount,
        pendingApplicationsCount,
      },
    });
  } catch (error) {
    if (error.message?.includes("SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("Admin opportunities fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load opportunities" },
      { status: 500 }
    );
  }
}

// POST /api/admin/opportunities - Create a new job opportunity
export async function POST(request) {
  try {
    const session = await requireSuperAdmin(request);
    const body = await request.json();

    const {
      title,
      company,
      type = "Full-time",
      location = "Remote",
      salary = "",
      description,
      tags = [],
      requirements = "",
      applyLink = "",
      status = "ACTIVE",
      featured = false,
    } = body;

    if (!title || !company || !description) {
      return NextResponse.json(
        { success: false, error: "Title, company, and description are required." },
        { status: 400 }
      );
    }

    let formattedTags = "[]";
    if (Array.isArray(tags)) {
      formattedTags = JSON.stringify(tags.map((t) => String(t).trim()).filter(Boolean));
    } else if (typeof tags === "string") {
      formattedTags = JSON.stringify(tags.split(",").map((t) => t.trim()).filter(Boolean));
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        type: type.trim(),
        location: location.trim(),
        salary: salary ? salary.trim() : null,
        description: description.trim(),
        tags: formattedTags,
        requirements: requirements ? requirements.trim() : null,
        applyLink: applyLink ? applyLink.trim() : null,
        status,
        featured: Boolean(featured),
        postedBy: session?.user?.id || session?.user?.email || "SUPER_ADMIN",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Opportunity created successfully",
      data: opportunity,
    });
  } catch (error) {
    if (error.message?.includes("SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("Admin create opportunity error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}
