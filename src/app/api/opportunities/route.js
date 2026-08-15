import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Replace this array with your database call (e.g., Prisma query) when ready
    const opportunities = [];

    return NextResponse.json({ success: true, opportunities }, { status: 200 });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}