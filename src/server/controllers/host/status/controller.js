import { NextResponse } from "next/server";
import { getAuthToken } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { getHostApplicationByUserId } from "@/server/services/hostVerificationService";

export async function GET(request) {
  try {
    const token = await getAuthToken(request);
    if (!token?.sub) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, role: true, email: true, name: true, fullName: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const application = await getHostApplicationByUserId(user.id);

    return NextResponse.json({
      success: true,
      userRole: user.role,
      hasApplication: Boolean(application),
      application,
    });
  } catch (error) {
    console.error("GET Host Status Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch host verification status" },
      { status: 500 }
    );
  }
}