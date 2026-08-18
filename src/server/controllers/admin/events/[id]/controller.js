import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";
import { validateAndSanitizeEventData } from "@/server/services/eventSanitizerService";
import { invalidateEventsCache } from "@/server/services/eventsCacheService";

export async function GET(request, { params }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, fullName: true, email: true, image: true, role: true },
        },
        registrations: {
          take: 10,
          orderBy: { registeredAt: "desc" },
          include: { user: { select: { id: true, name: true, fullName: true, email: true, image: true } } },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch audit logs associated with this event or organizer
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { reason: { contains: event.id } },
          { reason: { contains: event.title } },
        ],
      },
      take: 15,
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({ success: true, data: event, auditLogs });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("GET Admin Event Detail Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const admin = await requireSuperAdmin(request);
    const { id } = await params;
    const rawData = await request.json();

    const existing = await prisma.event.findUnique({
      where: { id },
      include: { organizer: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const validation = validateAndSanitizeEventData(rawData, true);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(" ") },
        { status: 400 }
      );
    }

    const sanitized = validation.sanitized;

    // Verify organizerId if changed
    let organizerId = existing.organizerId;
    if (rawData.organizerId !== undefined) {
      if (rawData.organizerId) {
        const orgUser = await prisma.user.findUnique({
          where: { id: rawData.organizerId },
          select: { id: true },
        });
        if (orgUser) organizerId = orgUser.id;
      } else {
        organizerId = null;
      }
    }

    const status = ["Active", "Completed", "Suspended"].includes(rawData.status)
      ? rawData.status
      : existing.status;
    const archived = typeof rawData.archived === "boolean" ? rawData.archived : existing.archived;
    const popularityScore =
      rawData.popularityScore !== undefined && !isNaN(parseFloat(rawData.popularityScore))
        ? parseFloat(rawData.popularityScore)
        : existing.popularityScore;
    const schedule = rawData.schedule !== undefined ? (rawData.schedule ? String(rawData.schedule).trim() : null) : existing.schedule;
    const prizePool = rawData.prizePool !== undefined ? (rawData.prizePool ? String(rawData.prizePool).trim() : null) : existing.prizePool;

    const [updatedEvent] = await prisma.$transaction([
      prisma.event.update({
        where: { id },
        data: {
          title: sanitized.title || existing.title,
          type: sanitized.type || existing.type,
          category: sanitized.category || existing.category,
          description: sanitized.description || existing.description,
          location: sanitized.location || existing.location,
          date: sanitized.date || existing.date,
          capacity: sanitized.capacity !== undefined ? sanitized.capacity : existing.capacity,
          price: sanitized.price !== undefined ? sanitized.price : existing.price,
          bannerUrl: sanitized.bannerUrl !== undefined ? sanitized.bannerUrl : existing.bannerUrl,
          googleMapsUrl: sanitized.googleMapsUrl !== undefined ? sanitized.googleMapsUrl : existing.googleMapsUrl,
          ticketType: sanitized.ticketType || existing.ticketType,
          waitlistEnabled: sanitized.waitlistEnabled !== undefined ? sanitized.waitlistEnabled : existing.waitlistEnabled,
          zone: sanitized.zone !== undefined ? sanitized.zone : existing.zone,
          city: sanitized.city || existing.city,
          state: sanitized.state || existing.state,
          country: sanitized.country || existing.country,
          tags: sanitized.tags || existing.tags,
          keywords: sanitized.keywords || existing.keywords,
          schedule,
          prizePool,
          popularityScore,
          status,
          archived,
          customRegistrationCount:
            sanitized.customRegistrationCount !== undefined
              ? sanitized.customRegistrationCount
              : existing.customRegistrationCount,
          customOrganizerName:
            sanitized.customOrganizerName !== undefined
              ? sanitized.customOrganizerName
              : existing.customOrganizerName,
          organizerId,
        },
        include: {
          organizer: {
            select: { id: true, name: true, fullName: true, email: true, image: true, role: true },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "EVENT_UPDATED",
          previousStatus: `${existing.status} (Archived: ${existing.archived})`,
          newStatus: `${status} (Archived: ${archived})`,
          reason: rawData.reason ? `[Event: ${existing.title} (${id})] ${rawData.reason}` : `Super Admin updated event details for "${existing.title}" (${id})`,
        },
      }),
    ]);

    invalidateEventsCache();

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: "Event updated successfully",
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("PUT Admin Event Error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const admin = await requireSuperAdmin(request);
    const { id } = await params;
    const rawData = await request.json();

    const existing = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let newCount = null;
    if (
      rawData.customRegistrationCount !== null &&
      rawData.customRegistrationCount !== "" &&
      rawData.customRegistrationCount !== undefined
    ) {
      const parsed = parseInt(rawData.customRegistrationCount, 10);
      if (isNaN(parsed) || parsed < 0 || parsed > 10000000) {
        return NextResponse.json(
          { error: "Custom registration count must be a non-negative number up to 10,000,000." },
          { status: 400 }
        );
      }
      newCount = parsed;
    }

    const [updatedEvent] = await prisma.$transaction([
      prisma.event.update({
        where: { id },
        data: { customRegistrationCount: newCount },
        include: {
          organizer: {
            select: { id: true, name: true, fullName: true, email: true, image: true, role: true },
          },
          _count: { select: { registrations: true } },
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "EVENT_REGISTRATIONS_TWEAKED",
          previousStatus: `Custom: ${existing.customRegistrationCount ?? "None"} (Real: ${existing._count.registrations})`,
          newStatus: `Custom: ${newCount ?? "None"} (Real: ${existing._count.registrations})`,
          reason: `Super Admin tweaked total registrations for "${existing.title}" (${id}) to ${newCount !== null ? newCount : "Real count (" + existing._count.registrations + ")"}`,
        },
      }),
    ]);

    invalidateEventsCache();

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: `Total registrations updated to ${newCount !== null ? newCount : "Real (" + existing._count.registrations + ")"}.`,
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("PATCH Admin Event Registrations Error:", error);
    return NextResponse.json({ error: "Failed to tweak registrations" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireSuperAdmin(request);
    const { id } = await params;

    const existing = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.event.delete({
        where: { id },
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "EVENT_DELETED",
          previousStatus: existing.status,
          newStatus: "DELETED",
          reason: `Super Admin permanently deleted event "${existing.title}" (${id})`,
        },
      }),
    ]);

    invalidateEventsCache();

    return NextResponse.json({
      success: true,
      message: "Event deleted permanently",
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("DELETE Admin Event Error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
