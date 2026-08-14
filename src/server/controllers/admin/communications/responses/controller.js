import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/server/auth/guards";
import { listResponses } from "@/server/services/communicationService";

// GET: List all user submitted document & media responses (for admin panel only)
export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const communicationId = searchParams.get("communicationId") || undefined;
    const adminReviewStatus = searchParams.get("status") || "ALL";
    const type = searchParams.get("type") || "ALL";
    const search = searchParams.get("search") || "";
    const onlyResponded = searchParams.get("all") !== "true";

    const result = await listResponses({
      page,
      limit,
      communicationId,
      adminReviewStatus,
      type,
      search,
      onlyResponded,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("GET Admin Responses Error:", error);
    return NextResponse.json({ error: "Failed to fetch user responses" }, { status: 500 });
  }
}
