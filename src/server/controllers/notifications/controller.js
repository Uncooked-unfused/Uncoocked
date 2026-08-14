import { NextResponse } from "next/server";
import { getAuthToken } from "@/server/auth/guards";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/server/services/notificationService";

export async function GET(request) {
  try {
    const token = await getAuthToken(request);
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const result = await getUserNotifications(token.sub, { page, limit });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("GET Notifications Error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = await getAuthToken(request);
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId, markAll } = await request.json();

    if (markAll) {
      await markAllNotificationsAsRead(token.sub);
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (notificationId) {
      await markNotificationAsRead(notificationId, token.sub);
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Missing notificationId or markAll parameter" }, { status: 400 });
  } catch (error) {
    console.error("POST Notification Read Error:", error);
    return NextResponse.json({ error: "Failed to update notification status" }, { status: 500 });
  }
}
