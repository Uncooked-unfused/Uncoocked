import { NextResponse } from "next/server";
import { getAuthToken } from "@/server/auth/guards";
import { createHostApplication } from "@/server/services/hostVerificationService";

export async function POST(request) {
  try {
    const token = await getAuthToken(request);
    if (!token?.sub) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Basic payload validation
    const { organizationName, organizationType, organizationEmail, address, description } = body;
    if (!organizationName || !organizationType || !organizationEmail || !address || !description) {
      return NextResponse.json(
        { error: "All required fields must be provided." },
        { status: 400 }
      );
    }

    // Delegates application creation or update to service layer
    const application = await createHostApplication(token.sub, body);

    return NextResponse.json({
      success: true,
      message: "Host application submitted successfully.",
      data: application,
      application,
    });
  } catch (error) {
    console.error("POST Host Apply Error:", error);
    const isConflict = error.message?.includes("already exists");
    const isValidation = error.message?.includes("required");
    const statusCode = isConflict ? 409 : isValidation ? 400 : 500;

    return NextResponse.json(
      { error: error.message || "Failed to submit host application" },
      { status: statusCode }
    );
  }
}