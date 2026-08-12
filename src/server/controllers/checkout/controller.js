import { NextResponse } from "next/server";
import { prisma } from "../../db/prisma";

export async function POST(req) {
  try {
    // 1. Parse and validate incoming payload data
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { eventId, userId } = body;
    if (!eventId || !userId) {
      return NextResponse.json({ error: "Missing required fields: eventId or userId" }, { status: 400 });
    }

    // 2. Resolve database userId if an email string was provided
    let resolvedUserId = userId;
    if (userId.includes("@")) {
      const dbUser = await prisma.user.findUnique({ where: { email: userId } });
      if (!dbUser) {
        return NextResponse.json({ error: "Authenticated user record not found" }, { status: 404 });
      }
      resolvedUserId = dbUser.id;
    }

    // 3. Database transaction for event availability and duplicate checks
    const event = await prisma.$transaction(async (tx) => {
      const dbEvent = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: { registrations: { where: { status: "Confirmed" } } }
          }
        }
      });

      if (!dbEvent) {
        throw new Error("EVENT_NOT_FOUND");
      }

      const existingReg = await tx.registration.findUnique({
        where: {
          userId_eventId: {
            userId: resolvedUserId,
            eventId: dbEvent.id
          }
        }
      });

      if (existingReg && existingReg.status === "Confirmed") {
        throw new Error("ALREADY_REGISTERED");
      }

      if (dbEvent.capacity && dbEvent._count.registrations >= dbEvent.capacity) {
        throw new Error("EVENT_FULL");
      }

      return dbEvent;
    });

    // 4. Bypassed Payment Flow: Force direct confirmation for all events
    const registration = await prisma.registration.create({
      data: {
        userId: resolvedUserId,
        eventId: event.id,
        status: "Confirmed",
      }
    });

    return NextResponse.json({
      success: true,
      isFree: true,
      message: "Registration successful!",
      registrationId: registration.id
    }, { status: 201 });

  } catch (error) {
    if (error.message === "EVENT_NOT_FOUND") {
      return NextResponse.json({ error: "The requested event does not exist" }, { status: 404 });
    }
    if (error.message === "ALREADY_REGISTERED") {
      return NextResponse.json({ error: "You are already registered for this event" }, { status: 400 });
    }
    if (error.message === "EVENT_FULL") {
      return NextResponse.json({ error: "Registration failed. Event capacity is fully booked" }, { status: 409 });
    }

    console.error("[CHECKOUT ERROR]:", error);
    return NextResponse.json({ error: "An unexpected registration error occurred" }, { status: 500 });
  }
}