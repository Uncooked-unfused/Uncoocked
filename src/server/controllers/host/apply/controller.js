import { NextResponse } from "next/server";
import { getAuthToken } from "@/server/auth/guards";
import { createHostApplication } from "@/server/services/hostVerificationService";

export async function POST(request) {
  try {
    const token = await getAuthToken(request);
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized: Please log in first." }, { status: 401 });
    }

    const body = await request.json();
    const application = await createHostApplication(token.sub, body);

    return NextResponse.json({ success: true, data: application });
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
