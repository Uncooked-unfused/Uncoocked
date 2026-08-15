import { NextResponse } from "next/server";
import { getSystemHealthStatus } from "@/server/services/systemMonitoringService";

export async function GET() {
  try {
    const health = await getSystemHealthStatus();
    const statusCode = health.dbStatus === "DISCONNECTED" || health.status === "UNHEALTHY" ? 503 : 200;
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      { status: "UNHEALTHY", error: error.message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
