import { NextResponse } from 'next/server';
import { prisma } from "@/server/db/prisma";
import { getAuthToken, requireEventManager } from "@/server/auth/guards";

export async function GET(request, context) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const eventId = params.eventId;

    if (!(await requireEventManager(eventId, token))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        analytics: true,
        registrations: {
          include: {
            user: true,
          },
          orderBy: {
            registeredAt: 'desc'
          },
          take: 5
        },
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Calculate aggregated stats
    const totalViews = event.analytics.reduce((acc, a) => acc + a.views, 0);
    const totalRegistrations = await prisma.registration.count({
      where: { eventId }
    });
    const totalRevenue = event.analytics.reduce((acc, a) => acc + a.revenue, 0);
    const capacityUtil = event.capacity > 0 ? Math.round((totalRegistrations / event.capacity) * 100) : 0;

    // Recent activities (Registrations as proxy for activity right now)
    const recentActivities = event.registrations.map(r => ({
      id: r.id,
      type: "REGISTER",
      user: r.user.name || r.user.email?.split('@')[0] || "Guest",
      time: new Date(r.registeredAt).toLocaleString()
    }));

    return NextResponse.json({
      success: true,
      stats: {
        views: totalViews,
        registrations: totalRegistrations,
        revenue: totalRevenue,
        capacityUtil,
        capacity: event.capacity
      },
      activities: recentActivities
    });

  } catch (error) {
    console.error('Organizer Overview API error:', error);
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 });
  }
}
