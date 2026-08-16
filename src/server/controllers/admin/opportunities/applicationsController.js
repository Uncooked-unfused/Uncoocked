import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";

export const runtime = "nodejs";

// GET /api/admin/opportunities/applications - List all applications across opportunities
export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const opportunityId = searchParams.get("opportunityId") || "";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const skip = (page - 1) * limit;

    const where = {
      ...(status !== "ALL" ? { status } : {}),
      ...(opportunityId ? { opportunityId } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { role: { contains: search, mode: "insensitive" } },
              { message: { contains: search, mode: "insensitive" } },
              { opportunity: { title: { contains: search, mode: "insensitive" } } },
              { opportunity: { company: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [applications, totalFiltered] = await Promise.all([
      prisma.opportunityApplication.findMany({
        where,
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
              company: true,
              type: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.opportunityApplication.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      items: applications,
      total: totalFiltered,
      page,
      limit,
    });
  } catch (error) {
    if (error.message?.includes("SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("Admin applications list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load applications" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/opportunities/applications/[id] - Update application status or notes
export async function PATCH(request, { params }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.opportunityApplication.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    const updateData = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;

    const updated = await prisma.opportunityApplication.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Application updated successfully",
      data: updated,
    });
  } catch (error) {
    if (error.message?.includes("SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("Admin update application error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/opportunities/applications/[id] - Delete application
export async function DELETE(request, { params }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    await prisma.opportunityApplication.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    if (error.message?.includes("SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("Admin delete application error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
