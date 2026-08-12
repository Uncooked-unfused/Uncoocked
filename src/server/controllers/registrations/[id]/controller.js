import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthToken, requireEventManager } from "@/server/auth/guards";

const prisma = new PrismaClient({});

export async function DELETE(request, context) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const id = params.id;

    // Fetch the registration first to identify the corresponding event
    const registration = await prisma.registration.findUnique({
      where: { id }
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const eventId = registration.eventId;

    const isOwner = registration.userId === token.sub;
    const isManager = await requireEventManager(eventId, token);

    if (!isOwner && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Execute atomic transaction without nested await
    await prisma.$transaction([
      prisma.registration.delete({
        where: { id },
      }),
      // Decrement the registration count in analytics safely
      prisma.eventAnalytic.upsert({
        where: { id: `analytic-${eventId}` },
        update: {
          registrations: { decrement: 1 }
        },
        create: {
          id: `analytic-${eventId}`,
          eventId: eventId,
          registrations: 0
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete registration:', error);
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
  }
}