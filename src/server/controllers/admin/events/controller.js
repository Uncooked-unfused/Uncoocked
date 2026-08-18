import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireSuperAdmin } from "@/server/auth/guards";
import { validateAndSanitizeEventData } from "@/server/services/eventSanitizerService";
import { invalidateEventsCache } from "@/server/services/eventsCacheService";
import { DEFAULT_CITY, DEFAULT_STATE, DEFAULT_COUNTRY } from "@/config/cities";

export async function GET(request) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusUpper = (searchParams.get("status") || "ALL").toUpperCase();
    const sortBy = searchParams.get("sortBy") || "createdAt_desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where = {
      ...(statusUpper === "SUSPENDED"
        ? { status: "Suspended" }
        : statusUpper === "ARCHIVED"
        ? { archived: true }
        : statusUpper === "ACTIVE"
        ? { status: "Active", archived: false }
        : statusUpper === "COMPLETED"
        ? { status: "Completed" }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
              { category: { contains: search } },
              { location: { contains: search } },
              { customOrganizerName: { contains: search } },
              { organizer: { name: { contains: search } } },
              { organizer: { email: { contains: search } } },
            ],
          }
        : {}),
    };

    let orderBy = { createdAt: "desc" };
    if (sortBy === "createdAt_asc") {
      orderBy = { createdAt: "asc" };
    } else if (sortBy === "date_asc") {
      orderBy = { date: "asc" };
    } else if (sortBy === "popularity_desc") {
      orderBy = { popularityScore: "desc" };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: { id: true, name: true, fullName: true, email: true, image: true },
          },
          _count: {
            select: { registrations: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("GET Admin Events Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await requireSuperAdmin(request);
    const rawData = await request.json();

    const validation = validateAndSanitizeEventData(rawData, false);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(" ") },
        { status: 400 }
      );
    }

    const sanitized = validation.sanitized;

    // Validate organizerId if provided; if none or invalid, default to the Super Admin
    let organizerId = rawData.organizerId || admin.id;
    if (organizerId) {
      const organizerExists = await prisma.user.findUnique({
        where: { id: organizerId },
        select: { id: true },
      });
      if (!organizerExists) {
        organizerId = admin.id;
      }
    } else {
      organizerId = admin.id;
    }

    // Generate or sanitize event ID
    const eventId =
      rawData.id && typeof rawData.id === "string" && rawData.id.trim()
        ? rawData.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-")
        : `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Verify ID uniqueness
    const existingId = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (existingId) {
      return NextResponse.json(
        { error: `Event ID "${eventId}" already exists. Please choose a different ID or leave blank.` },
        { status: 400 }
      );
    }

    // Extract admin-controlled optional attributes
    const status = ["Active", "Completed", "Suspended"].includes(rawData.status)
      ? rawData.status
      : "Active";
    const archived = Boolean(rawData.archived);
    const popularityScore =
      rawData.popularityScore !== undefined && !isNaN(parseFloat(rawData.popularityScore))
        ? parseFloat(rawData.popularityScore)
        : 0;
    const schedule = typeof rawData.schedule === "string" ? rawData.schedule.trim() : null;
    const prizePool = typeof rawData.prizePool === "string" ? rawData.prizePool.trim() : null;

    const [newEvent] = await prisma.$transaction([
      prisma.event.create({
        data: {
          id: eventId,
          title: sanitized.title,
          type: sanitized.type,
          category: sanitized.category,
          tags: sanitized.tags,
          keywords: sanitized.keywords,
          date: sanitized.date,
          location: sanitized.location,
          zone: sanitized.zone,
          city: sanitized.city || DEFAULT_CITY,
          state: sanitized.state || DEFAULT_STATE,
          country: sanitized.country || DEFAULT_COUNTRY,
          description: sanitized.description,
          schedule,
          prizePool,
          bannerUrl: sanitized.bannerUrl,
          googleMapsUrl: sanitized.googleMapsUrl,
          ticketType: sanitized.ticketType,
          price: sanitized.price,
          capacity: sanitized.capacity,
          waitlistEnabled: sanitized.waitlistEnabled,
          popularityScore,
          status,
          archived,
          customRegistrationCount:
            sanitized.customRegistrationCount !== undefined ? sanitized.customRegistrationCount : null,
          customOrganizerName:
            sanitized.customOrganizerName !== undefined ? sanitized.customOrganizerName : null,
          organizerId,
        },
        include: {
          organizer: {
            select: { id: true, name: true, fullName: true, email: true },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "EVENT_CREATED",
          previousStatus: null,
          newStatus: status,
          reason: `Super Admin created event "${sanitized.title}" (${eventId}) with status ${status}${archived ? " (Archived)" : ""}`,
        },
      }),
    ]);

    invalidateEventsCache();

    return NextResponse.json({
      success: true,
      data: newEvent,
      message: "Event created successfully.",
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }
    console.error("POST Admin Create Event Error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
