import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";
import { withAdminRateLimit } from "@/server/middleware/rateLimit";

export const POST = withAdminRateLimit(async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    const { reviewIds, action, reason } = await request.json();

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json({ error: "Missing or empty reviewIds array" }, { status: 400 });
    }

    if (!["DELETE", "BULK_DELETE"].includes(action)) {
      return NextResponse.json({ error: "Invalid batch action" }, { status: 400 });
    }

    const processed = [];
    const errors = [];

    for (const reviewId of reviewIds) {
      try {
        const review = await prisma.review.findUnique({
          where: { id: reviewId },
        });

        if (!review) continue;

        await prisma.$transaction([
          prisma.review.delete({
            where: { id: reviewId },
          }),
          prisma.auditLog.create({
            data: {
              adminId: admin.id,
              action: "REVIEW_BULK_DELETED",
              previousStatus: `Rating: ${review.rating}★ by ${review.userName}`,
              newStatus: "DELETED",
              reason: reason || `Bulk delete action on review by ${review.userEmail}`,
            },
          }),
        ]);

        processed.push(reviewId);
      } catch (err) {
        errors.push({ reviewId, error: err.message });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      processedCount: processed.length,
      failedCount: errors.length,
      processed,
      errors,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("POST Batch Review Action Error:", error);
    return NextResponse.json({ error: "Batch review action failed" }, { status: 500 });
  }
});
