import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";
import { withAdminRateLimit } from "@/server/middleware/rateLimit";

// 1. GET: Fetch single review details
export async function GET(request, { params }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("GET Admin Review By ID Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. PATCH: Update review content or rating
export const PATCH = withAdminRateLimit(async function PATCH(request, { params }) {
  try {
    const admin = await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { rating, comment, userName, reason } = body;

    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const dataToUpdate = {};
    if (rating !== undefined) {
      const parsedRating = parseInt(rating, 10);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
      }
      dataToUpdate.rating = parsedRating;
    }
    if (comment !== undefined) {
      dataToUpdate.comment = String(comment).trim();
    }
    if (userName !== undefined) {
      dataToUpdate.userName = String(userName).trim();
    }

    const [updatedReview] = await prisma.$transaction([
      prisma.review.update({
        where: { id },
        data: dataToUpdate,
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "REVIEW_UPDATED",
          previousStatus: `Rating: ${existing.rating}★`,
          newStatus: rating !== undefined ? `Rating: ${dataToUpdate.rating}★` : `Rating: ${existing.rating}★`,
          reason: reason || `Updated review ${id} for ${existing.userEmail}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: updatedReview });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("PATCH Admin Review Error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
});

// 3. DELETE: Delete a single review
export const DELETE = withAdminRateLimit(async function DELETE(request, { params }) {
  try {
    const admin = await requireSuperAdmin(request);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason") || "Deleted by Super Admin";

    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.review.delete({
        where: { id },
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "REVIEW_DELETED",
          previousStatus: `Rating: ${existing.rating}★ by ${existing.userName}`,
          newStatus: "DELETED",
          reason: `${reason} (Target: ${existing.userEmail} - "${existing.comment.substring(0, 40)}...")`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("DELETE Admin Review Error:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
});
