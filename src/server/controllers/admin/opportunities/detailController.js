import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";

export const runtime = "nodejs";

// GET /api/admin/opportunities/[id] - Get opportunity details and applications
export async function GET(request, { params }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        applications: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { success: false, error: "Opportunity not found" },
        { status: 404 }
      );
    }

    let tags = [];
    try {
      tags = JSON.parse(opportunity.tags);
    } catch {
      tags = opportunity.tags ? opportunity.tags.split(",").map((t) => t.trim()) : [];
    }

    return NextResponse.json({
      success: true,
      data: {
        ...opportunity,
        tags,
      },
    });
  } catch (error) {
    if (error.message?.includes("SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("Admin get opportunity detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch opportunity" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/opportunities/[id] - Update opportunity details
export async function PATCH(request, { params }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Opportunity not found" },
        { status: 404 }
      );
    }

    const updateData = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.company !== undefined) updateData.company = body.company.trim();
    if (body.type !== undefined) updateData.type = body.type.trim();
    if (body.location !== undefined) updateData.location = body.location.trim();
    if (body.salary !== undefined) updateData.salary = body.salary ? body.salary.trim() : null;
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.requirements !== undefined) updateData.requirements = body.requirements ? body.requirements.trim() : null;
    if (body.applyLink !== undefined) updateData.applyLink = body.applyLink ? body.applyLink.trim() : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.featured !== undefined) updateData.featured = Boolean(body.featured);

    if (body.tags !== undefined) {
      if (Array.isArray(body.tags)) {
        updateData.tags = JSON.stringify(body.tags.map((t) => String(t).trim()).filter(Boolean));
      } else if (typeof body.tags === "string") {
        updateData.tags = JSON.stringify(body.tags.split(",").map((t) => t.trim()).filter(Boolean));
      }
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Opportunity updated successfully",
      data: updated,
    });
  } catch (error) {
    if (error.message?.includes("SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("Admin update opportunity error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update opportunity" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/opportunities/[id] - Delete opportunity
export async function DELETE(request, { params }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    await prisma.opportunity.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Opportunity deleted successfully",
    });
  } catch (error) {
    if (error.message?.includes("SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("Admin delete opportunity error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete opportunity" },
      { status: 500 }
    );
  }
}
