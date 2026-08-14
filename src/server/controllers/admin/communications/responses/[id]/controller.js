import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/server/auth/guards";
import { withAdminRateLimit } from "@/server/middleware/rateLimit";
import { updateAdminReview } from "@/server/services/communicationService";

// PATCH: Update admin review status and notes for a user response
export const PATCH = withAdminRateLimit(async function PATCH(request, { params }) {
  try {
    const admin = await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const { status, notes } = body;

    if (!status) {
      return NextResponse.json({ error: "Review status is required" }, { status: 400 });
    }

    const updated = await updateAdminReview({
      recipientId: id,
      adminId: admin.id,
      adminReviewStatus: status,
      adminReviewNotes: notes,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Response review status updated to ${status}.`,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("PATCH Admin Response Review Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update review" }, { status: 400 });
  }
});
