import { NextResponse } from "next/server";
import { getAuthToken } from "@/server/auth/guards";
import { getUserRequestDetails, submitUserDocumentResponse } from "@/server/services/communicationService";

// GET: Fetch request details for a recipient
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(request);
    const sessionUserId = token?.sub || null;

    const requestDetails = await getUserRequestDetails(id, sessionUserId);

    return NextResponse.json({
      success: true,
      data: requestDetails,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized to access this request" }, { status: 403 });
    }
    if (error.message === "Request not found") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    console.error("GET Request Details Error:", error);
    return NextResponse.json({ error: "Failed to fetch request details" }, { status: 500 });
  }
}

// POST: Submit user response with document URL / media links and notes
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(request);
    const sessionUserId = token?.sub || null;

    const body = await request.json();
    const { documentUrl, mediaUrls, responseNotes } = body;

    const updated = await submitUserDocumentResponse({
      recipientId: id,
      sessionUserId,
      documentUrl,
      mediaUrls,
      responseNotes,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Your submission has been received and sent to platform administrators for review.",
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("POST User Response Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit response" }, { status: 400 });
  }
}
