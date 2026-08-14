import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getAuthToken, requireEventManager } from "@/server/auth/guards";

export async function GET(request, { params }) {
  const { id } = await params;
  
  try {
    const announcements = await prisma.bulletinUpdate.findMany({
      where: { eventId: id },
      orderBy: { postedAt: 'desc' }
    });

    // We can map these to include visibility and pinned status if we updated the schema for it,
    // otherwise we just return them. For now, we mock the extra fields frontend expects.
    const formatted = announcements.map(ann => ({
      id: ann.id,
      title: ann.title,
      content: ann.content,
      date: ann.postedAt.toISOString().split('T')[0],
      visibility: "All", // Mocked
      isPinned: false // Mocked
    }));

    return NextResponse.json({ announcements: formatted }, { status: 200 });
  } catch (error) {
    console.error("Announcements API Error:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { title, content, visibility, isPinned } = await request.json();

  const token = await getAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await requireEventManager(id, token))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  try {
    const newAnnouncement = await prisma.bulletinUpdate.create({
      data: {
        eventId: id,
        title,
        content,
        // visibility and isPinned would go here if schema had them
      }
    });

    return NextResponse.json({ success: true, announcement: newAnnouncement }, { status: 201 });
  } catch (error) {
    console.error("Create Announcement Error:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const announcementId = searchParams.get("announcementId") || searchParams.get("id");

  const token = await getAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await requireEventManager(id, token))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    if (!announcementId) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    await prisma.bulletinUpdate.deleteMany({
      where: { id: announcementId, eventId: id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete Announcement Error:", error);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
