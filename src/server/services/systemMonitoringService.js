import { prisma } from "../db/prisma.js";

// In-memory ring buffer for recent API response times (last 200 requests)
const MAX_BUFFER_SIZE = 200;
const apiLatencyBuffer = [];
let totalRequests = 0;
let errorRequests = 0;

export function recordApiMetrics(durationMs, statusCode) {
  apiLatencyBuffer.push(durationMs);
  if (apiLatencyBuffer.length > MAX_BUFFER_SIZE) {
    apiLatencyBuffer.shift();
  }
  totalRequests++;
  if (statusCode >= 500) {
    errorRequests++;
  }
}

export async function measureDatabaseLatency() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Date.now() - start;
  } catch (err) {
    console.error("Failed to measure DB latency:", err);
    return -1;
  }
}

export function getSystemMemoryMetrics() {
  const mem = process.memoryUsage();
  return {
    rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
    heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
    heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
    heapUsagePct: Math.round((mem.heapUsed / mem.heapTotal) * 100),
  };
}

export function calculateP95Latency() {
  if (apiLatencyBuffer.length === 0) return 0;
  const sorted = [...apiLatencyBuffer].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * 0.95);
  return sorted[index] || sorted[sorted.length - 1];
}

let cachedHealth = null;
let lastHealthCheckTime = 0;
const HEALTH_CACHE_TTL_MS = 30_000;

export async function getSystemHealthStatus() {
  const now = Date.now();
  if (cachedHealth && now - lastHealthCheckTime < HEALTH_CACHE_TTL_MS) {
    return cachedHealth;
  }

  const dbLatencyMs = await measureDatabaseLatency();
  const memory = getSystemMemoryMetrics();
  const p95LatencyMs = calculateP95Latency();
  const errorRatePct = totalRequests > 0 ? Math.round((errorRequests / totalRequests) * 10000) / 100 : 0;

  const isHealthy = dbLatencyMs >= 0 && dbLatencyMs < 1000 && memory.heapUsagePct < 90 && errorRatePct < 5;

  cachedHealth = {
    status: isHealthy ? "HEALTHY" : "DEGRADED",
    dbStatus: dbLatencyMs >= 0 ? "CONNECTED" : "DISCONNECTED",
    dbLatencyMs,
    p95LatencyMs,
    memory,
    errorRatePct,
    totalRequestsRecorded: totalRequests,
    timestamp: new Date().toISOString(),
  };
  lastHealthCheckTime = now;

  return cachedHealth;
}

export async function captureTelemetrySnapshot() {
  const health = await getSystemHealthStatus();
  try {
    const snapshot = await prisma.systemTelemetrySnapshot.create({
      data: {
        cpuUsagePct: 0, // Placeholder for system CPU percentage
        memUsagePct: health.memory.heapUsagePct,
        apiLatencyP95: health.p95LatencyMs,
        dbLatencyMs: health.dbLatencyMs > 0 ? health.dbLatencyMs : 0,
        errorRatePct: health.errorRatePct,
      },
    });
    return snapshot;
  } catch (err) {
    console.error("Failed to capture telemetry snapshot:", err);
    return null;
  }
}

export async function getRecentTelemetrySnapshots(limit = 20) {
  return prisma.systemTelemetrySnapshot.findMany({
    take: limit,
    orderBy: { timestamp: "desc" },
  });
}
