import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";

const DEFAULT_OPPORTUNITIES = [
  {
    title: "Frontend Developer Intern",
    company: "NeonTech Labs",
    type: "Internship",
    location: "Remote",
    salary: "₹20/hr",
    description:
      "Join our core frontend team to build next-gen interactive React and Next.js applications.",
    tags: JSON.stringify(["React", "Next.js", "Tailwind"]),
    status: "ACTIVE",
    featured: true,
  },
  {
    title: "Smart Contract Bounty",
    company: "DeFi Protocols",
    type: "Bounty",
    location: "Remote",
    salary: "₹500 - ₹2000",
    description:
      "Find and patch vulnerabilities in our new liquidity pool staking contract on Ethereum.",
    tags: JSON.stringify(["Solidity", "Security", "Web3"]),
    status: "ACTIVE",
    featured: true,
  },
  {
    title: "Junior Data Scientist",
    company: "Quantum Analytics",
    type: "Full-time",
    location: "New York, NY",
    salary: "₹80k - ₹100k",
    description:
      "Analyze large datasets and train predictive machine learning models for fintech clients.",
    tags: JSON.stringify(["Python", "PyTorch", "SQL"]),
    status: "ACTIVE",
    featured: false,
  },
  {
    title: "UI/UX Design Freelance",
    company: "Creative Studios",
    type: "Freelance",
    location: "Hybrid",
    salary: "₹40/hr",
    description:
      "Design a high-converting landing page and onboarding flow for a new consumer app.",
    tags: JSON.stringify(["Figma", "Prototyping", "User Research"]),
    status: "ACTIVE",
    featured: false,
  },
  {
    title: "Backend Engineering Intern",
    company: "CloudScale Inc",
    type: "Internship",
    location: "San Francisco, CA",
    salary: "₹25/hr",
    description:
      "Help scale our Go microservices handling millions of concurrent requests daily.",
    tags: JSON.stringify(["Go", "Kubernetes", "AWS"]),
    status: "ACTIVE",
    featured: false,
  },
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    // Check if table has records, if not seed default ones
    const count = await prisma.opportunity.count();
    if (count === 0) {
      await prisma.opportunity.createMany({
        data: DEFAULT_OPPORTUNITIES,
      });
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
