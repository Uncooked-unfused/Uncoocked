import { NextResponse } from "next/server";
import { getAuthToken } from "@/server/auth/guards";
import { deleteNotification } from "@/server/services/notificationService";

export async function DELETE(request, { params }) {
  try {
    const token = await getAuthToken(request);
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteNotification(id, token.sub);

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("DELETE Notification Error:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
