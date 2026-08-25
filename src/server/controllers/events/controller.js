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
    const statusParam = searchParams.get('status');
    const typeFilter = searchParams.get('type');
    const categoryFilter = searchParams.get('category');
    const zoneFilter = searchParams.get('zone');

    const cacheKey = `events:${includeArchived}:${statusParam || ''}:${typeFilter || ''}:${categoryFilter || ''}:${zoneFilter || ''}`;
    const cached = await getCachedEvents(cacheKey);
    if (cached) {
      return NextResponse.json(
        { success: true, events: cached, cached: true },
        {
          headers: {
            "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
          },
        }
      );
    }

    const whereClause = {
      city: { in: ACTIVE_CITIES }
    };

    const normalizedStatus = statusParam
      ? statusParam.charAt(0).toUpperCase() + statusParam.slice(1).toLowerCase()
      : null;

    if (!includeArchived) {
      whereClause.archived = false;
      if (normalizedStatus) {
        whereClause.status = normalizedStatus;
      } else {
        whereClause.status = { in: ['Active', 'Completed'] };
      }
    } else if (normalizedStatus) {
      whereClause.status = normalizedStatus;
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

    const events = rawEvents.map((ev) => {
      const effectiveRegistrations =
        ev.customRegistrationCount !== null && ev.customRegistrationCount !== undefined
          ? ev.customRegistrationCount
          : (ev._count?.registrations || 0);
      return {
        ...ev,
        category: ev.category || ev.type,
        bannerUrl: ev.bannerUrl,
        _count: {
          ...ev._count,
          registrations: effectiveRegistrations,
        },
      };
    });

    await setCachedEvents(cacheKey, events);

    return NextResponse.json(
      {
        success: true,
        events,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
        },
      }
    );
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

    // Rate limiting event creation per user (10 events / minute)
    const { redis } = await import('@/lib/redis');
    const rl = await redis.rateLimit(`event-create:${token.sub}`, { limit: 10, windowMs: 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many event creation attempts. Please wait before retrying.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
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

    await invalidateEventsCache(newEvent.id);

    return NextResponse.json({
      success: true,
      event: newEvent,
    });
  } catch (error) {
    console.error('Events POST API error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
