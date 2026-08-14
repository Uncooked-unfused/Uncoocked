import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";

// GET: Quick user search for admin communication composer
export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const roleFilter = searchParams.get("role") || "ALL";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30", 10), 1), 100);

    const where = {
      ...(roleFilter !== "ALL"
        ? {
            role: roleFilter === "USER" ? { in: ["User", "USER"] } : roleFilter,
          }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { fullName: { contains: q, mode: "insensitive" } },
              { department: { contains: q, mode: "insensitive" } },
              { clubAssociation: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        fullName: true,
        email: true,
        role: true,
        image: true,
        clubAssociation: true,
        department: true,
        createdAt: true,
        hostApplication: {
          select: {
            id: true,
            status: true,
            organizationName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("GET Admin User Search Error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
