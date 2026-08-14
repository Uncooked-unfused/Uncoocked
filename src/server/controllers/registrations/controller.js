// app/api/registrations/route.js

import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthToken } from '@/server/auth/guards';

export async function GET(request) {
  try {
    // 1. SECURITY: Authenticate the requester using NextAuth JWT
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const email = searchParams.get('email');

    // 2. SECURITY: Extract requester's email safely from the secure token
    const requesterEmail = token.email; 

    let whereClause = {};

    if (eventId) {
      // Polymorphic lookup fallback for GET requests using the slug
      let event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { organizer: true, managers: { include: { user: true } } }
      });

      if (!event) {
        event = await prisma.event.findFirst({
          where: { title: eventId },
          include: { organizer: true, managers: { include: { user: true } } }
        });
      }
      
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      
      // Ensure strict authorization comparison using safe database schemas
      const isOwner = event.organizer?.email === requesterEmail;
      const isManager = event.managers?.some(m => m.user.email === requesterEmail);
      
      if (!isOwner && !isManager) {
        return NextResponse.json({ error: 'Unauthorized: You do not own this event' }, { status: 403 });
      }

      whereClause.eventId = event.id;
    } else if (email) {
      // Ensure users can only look up their own registrations unless they are admins
      if (email !== requesterEmail) {
        return NextResponse.json({ error: 'Forbidden: You can only view your own registrations' }, { status: 403 });
      }
      whereClause.user = { email };
    }

    const registrations = await prisma.registration.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, fullName: true, email: true, department: true, clubAssociation: true, image: true }
        },
        event: {
          include: {
            organizer: {
              select: { id: true, name: true, fullName: true, email: true, clubAssociation: true, image: true }
            }
          }
        },
        ticketTier: true,
        coupon: true,
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error('Failed to fetch registrations:', error);
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    // 3. SECURITY: Authenticate the registration POST creator
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!token.emailVerified) {
      return NextResponse.json({ error: 'Please verify your email address before registering for events.' }, { status: 403 });
    }

    const { eventId, name, track, teamName, status } = data;
    const email = data.email || token.email;

    if (!eventId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Dynamic resolution of both Primary Key IDs and Slugs
    let event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      event = await prisma.event.findFirst({
        where: { title: eventId }
      });
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Automatically provision user dynamically if they don't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email?.split('@')?.[0] || "User",
          fullName: name || email?.split('@')?.[0] || "User",
          department: track,
          clubAssociation: teamName,
        },
      });
    }

    // Defensive check to avoid unnecessary double-writes using resolved internal Event ID
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: event.id,
        }
      }
    });

    if (existingRegistration) {
      return NextResponse.json({ error: 'User is already registered for this event' }, { status: 409 });
    }

    // 4. DAILY ANALYTICS COMPILATION: Target midnight of today's calendar date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Write all records atomically in a database transaction
    const [registration] = await prisma.$transaction([
      prisma.registration.create({
        data: {
          userId: user.id,
          eventId: event.id,
          status: status || 'Pending',
          track,
          teamName,
        },
        include: {
          user: {
            select: { id: true, name: true, fullName: true, email: true, department: true, clubAssociation: true, image: true }
          },
          event: true,
        },
      }),
      // Upsert stats targeting specifically the compound key (eventId + date)
      prisma.eventAnalytic.upsert({
        where: {
          eventId_date: {
            eventId: event.id,
            date: today,
          },
        },
        create: {
          eventId: event.id,
          date: today,
          registrations: 1,
        },
        update: {
          registrations: { increment: 1 },
        },
      }),
    ]);

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    console.error('Failed to create registration:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'User is already registered for this event' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 });
  }
}