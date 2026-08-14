import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthToken } from '@/server/auth/guards';
import { ACTIVE_CITIES, DEFAULT_CITY, DEFAULT_STATE, DEFAULT_COUNTRY } from '@/config/cities';
import { getCachedEvents, setCachedEvents, invalidateEventsCache } from '@/server/services/eventsCacheService';
import { validateAndSanitizeEventData } from '@/server/services/eventSanitizerService';
import { isUserEligibleToHost } from '@/server/services/hostVerificationService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const typeFilter = searchParams.get('type');
    const categoryFilter = searchParams.get('category');
    const zoneFilter = searchParams.get('zone');

    const cacheKey = `events:${includeArchived}:${typeFilter || ''}:${categoryFilter || ''}:${zoneFilter || ''}`;
    const cached = getCachedEvents(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, events: cached, cached: true });
    }

    const whereClause = {
      city: { in: ACTIVE_CITIES }
    };

    if (!includeArchived) {
      whereClause.archived = false;
      whereClause.status = 'Active';
    }

    if (typeFilter && typeFilter !== 'All') {
      whereClause.type = typeFilter;
    }

    if (categoryFilter && categoryFilter !== 'All') {
      whereClause.category = categoryFilter;
    }

    if (zoneFilter && zoneFilter !== 'All') {
      whereClause.zone = zoneFilter;
    }

    const rawEvents = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        date: 'asc'
      },
      include: {
        bulletinUpdates: {
          orderBy: { postedAt: 'desc' }
        },
        organizer: {
          select: {
            id: true,
            name: true,
            fullName: true,
            image: true,
            clubAssociation: true,
            portfolioUrl: true,
          },
        },
        _count: {
          select: { registrations: true }
        }
      }
    });

    const events = rawEvents.map((ev) => ({
      ...ev,
      category: ev.category || ev.type,
      bannerUrl: ev.bannerUrl && ev.bannerUrl.startsWith("data:image")
        ? "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=60"
        : ev.bannerUrl,
    }));

    setCachedEvents(cacheKey, events);

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Please log in first.' }, { status: 401 });
    }
    if (!token.emailVerified) {
      return NextResponse.json({ error: 'Please verify your email address before creating events.' }, { status: 403 });
    }

    // Verify host/organizer eligibility using centralized host verification service
    const isEligible = await isUserEligibleToHost(token.sub);
    if (!isEligible) {
      return NextResponse.json(
        { error: 'Forbidden: Only verified event hosts and organizers can create events.' },
        { status: 403 }
      );
    }


    const rawData = await request.json();
    const validation = validateAndSanitizeEventData(rawData);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(' ') },
        { status: 400 }
      );
    }

    const sanitized = validation.sanitized;

    let organizerId = token.sub;
    if (!organizerId && token.email) {
      const user = await prisma.user.findUnique({ where: { email: token.email } });
      if (user) organizerId = user.id;
    }

    const eventId = rawData.id && typeof rawData.id === 'string'
      ? rawData.id.trim()
      : `ev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const newEvent = await prisma.event.create({
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
        bannerUrl: sanitized.bannerUrl,
        googleMapsUrl: sanitized.googleMapsUrl,
        ticketType: sanitized.ticketType,
        price: sanitized.price,
        capacity: sanitized.capacity,
        waitlistEnabled: sanitized.waitlistEnabled,
        organizerId: organizerId || null,
      },
    });

    invalidateEventsCache();

    return NextResponse.json({
      success: true,
      event: newEvent,
    });
  } catch (error) {
    console.error('Events POST API error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
