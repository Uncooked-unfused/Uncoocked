import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/server/auth/guards";
import { withAdminRateLimit } from "@/server/middleware/rateLimit";
import { dispatchCommunication, listCommunications } from "@/server/services/communicationService";
import { getBaseUrl } from "@/server/utils/baseUrl";

// GET: List all dispatched communications with aggregate response stats
export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const type = searchParams.get("type") || "ALL";
    const search = searchParams.get("search") || "";

    const result = await listCommunications({ page, limit, type, search });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("GET Admin Communications Error:", error);
    return NextResponse.json({ error: "Failed to fetch communications" }, { status: 500 });
  }
}

// POST: Create and dispatch new communication (individual or group)
export const POST = withAdminRateLimit(async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    const body = await request.json();

    const {
      subject,
      message,
      type = "NOTIFICATION",
      targetType = "INDIVIDUAL",
      targetGroup,
      targetUserIds,
      customEmails,
      requiredDocType,
      instructions,
      priority = "NORMAL",
      deadline,
    } = body;

    const result = await dispatchCommunication({
      adminId: admin.id,
      subject,
      message,
      type,
      targetType,
      targetGroup,
      targetUserIds,
      customEmails,
      requiredDocType,
      instructions,
      priority,
      deadline,
      baseUrl: getBaseUrl(request),
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Communication successfully dispatched to ${result.totalRecipients} recipient(s).`,
    }, { status: 201 });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("POST Admin Communication Error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch communication" }, { status: 400 });
  }
});
