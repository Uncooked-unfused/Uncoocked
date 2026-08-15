import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { mockOpportunities } from "@/lib/mockData";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    // Check if table has records, if not seed default ones
    const count = await prisma.opportunity.count();
    if (count === 0) {
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
    }

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

    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });

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

    return NextResponse.json({
      success: true,
      data: parsedOpportunities,
    });
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
