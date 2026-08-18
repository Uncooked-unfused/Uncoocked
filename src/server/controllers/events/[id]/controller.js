import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthToken, requireEventManager } from "@/server/auth/guards";
import { invalidateEventsCache } from '@/server/services/eventsCacheService';
import { validateAndSanitizeEventData } from '@/server/services/eventSanitizerService';

export async function GET(request, context) {
  try {
    const params = await context.params;
    const eventId = params.id;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bulletinUpdates: { orderBy: { postedAt: 'desc' } },
        organizer: {
          select: { id: true, name: true, fullName: true, image: true, clubAssociation: true, portfolioUrl: true }
        },
        _count: { select: { registrations: true } }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const effectiveRegistrations =
      event.customRegistrationCount !== null && event.customRegistrationCount !== undefined
        ? event.customRegistrationCount
        : (event._count?.registrations || 0);

    const sanitizedEvent = {
      ...event,
      category: event.category || event.type,
      bannerUrl: event.bannerUrl,
      _count: {
        ...event._count,
        registrations: effectiveRegistrations,
      },
    };

    return NextResponse.json({ success: true, event: sanitizedEvent });
  } catch (error) {
    console.error("Single Event GET API error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const eventId = params.id;
    const data = await request.json();

    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await requireEventManager(eventId, token))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const validation = validateAndSanitizeEventData(data, true);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(' ') },
        { status: 400 }
      );
    }

    const sanitized = validation.sanitized;

    const updateData = {};
    if (data.title !== undefined) updateData.title = sanitized.title;
    if (data.type !== undefined) {
      updateData.type = sanitized.type;
      updateData.category = sanitized.category;
    }
    if (data.date !== undefined) updateData.date = sanitized.date;
    if (data.location !== undefined) updateData.location = sanitized.location;
    if (data.description !== undefined) updateData.description = sanitized.description;
    if (data.bannerUrl !== undefined) updateData.bannerUrl = sanitized.bannerUrl;
    if (data.ticketType !== undefined) updateData.ticketType = sanitized.ticketType;
    if (data.price !== undefined) updateData.price = sanitized.price;
    if (data.capacity !== undefined) updateData.capacity = sanitized.capacity;
    if (data.waitlistEnabled !== undefined) updateData.waitlistEnabled = sanitized.waitlistEnabled;
    if (data.archived !== undefined) updateData.archived = Boolean(data.archived);
    if (data.googleMapsUrl !== undefined) updateData.googleMapsUrl = sanitized.googleMapsUrl;
    if (data.zone !== undefined) updateData.zone = sanitized.zone;
    if (data.tags !== undefined) updateData.tags = sanitized.tags;
    if (data.keywords !== undefined) updateData.keywords = sanitized.keywords;
    if (data.customOrganizerName !== undefined) updateData.customOrganizerName = sanitized.customOrganizerName;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    invalidateEventsCache();

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Events PUT API error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const eventId = params.id;

    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await requireEventManager(eventId, token))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    invalidateEventsCache();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Events DELETE API error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
