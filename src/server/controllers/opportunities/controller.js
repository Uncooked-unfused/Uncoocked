import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { mockOpportunities } from "@/lib/mockData";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where = {
      status: "ACTIVE",
      ...(type && type !== "All" ? { type } : {}),
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

    let opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });

    // Auto-seed if completely empty on root fetch
    if (opportunities.length === 0 && !search && (!type || type === "All")) {
      for (const mock of mockOpportunities) {
        await prisma.opportunity.upsert({
          where: { id: mock.id },
          update: {},
          create: {
            id: mock.id,
            title: mock.title,
            company: mock.company,
            type: mock.type,
            location: mock.location,
            salary: mock.salary || null,
            description: mock.description,
            tags: JSON.stringify(mock.tags || []),
            requirements: mock.requirements || null,
            applyLink: mock.applyLink || null,
            status: mock.status || "ACTIVE",
            featured: Boolean(mock.featured),
            postedBy: "SUPER_ADMIN",
          },
        });
      }
      opportunities = await prisma.opportunity.findMany({
        where,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      });
    }

    const parsedOpportunities = opportunities.map((opp) => {
      let tags = [];
      try {
        tags = JSON.parse(opp.tags);
      } catch {
        tags = opp.tags ? opp.tags.split(",").map((t) => t.trim()) : [];
      }
      return {
        ...opp,
        tags,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: parsedOpportunities,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
