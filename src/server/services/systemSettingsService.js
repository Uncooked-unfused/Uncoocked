import { prisma } from "../db/prisma.js";

// In-memory cache for settings with fast invalidation
let settingsCache = new Map();
let lastFetchTime = 0;
const CRITICAL_CACHE_TTL_MS = 0; // 0-ms TTL for instant changes to stats, kill switches, and maintenance
const STANDARD_CACHE_TTL_MS = 60 * 1000;

export function invalidateSystemSettingsCache() {
  settingsCache.clear();
  lastFetchTime = 0;
}

export async function getSystemSetting(key, defaultValue = null) {
  const now = Date.now();
  const isCriticalKey =
    key.startsWith("KILL_SWITCH_") ||
    key === "MAINTENANCE_MODE" ||
    key.startsWith("HOMEPAGE_STATS_");
  const maxAllowedAge = isCriticalKey ? CRITICAL_CACHE_TTL_MS : STANDARD_CACHE_TTL_MS;

  if (now - lastFetchTime > maxAllowedAge || !settingsCache.has(key)) {
    await refreshSettingsCache();
  }
  return settingsCache.has(key) ? settingsCache.get(key) : defaultValue;
}

export async function getAllSystemSettings() {
  await refreshSettingsCache();
  const result = {};
  for (const [key, value] of settingsCache.entries()) {
    result[key] = value;
  }
  return result;
}

export async function setSystemSetting(key, value, updatedBy, type = "BOOLEAN", description = null, reason = null) {
  if (!key || typeof key !== "string" || !/^[A-Z0-9_]{3,64}$/.test(key)) {
    throw new Error("Invalid setting key format. Must be uppercase alphanumeric with underscores (3-64 chars).");
  }

  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  if (type === "NUMBER" && isNaN(Number(stringValue))) {
    throw new Error("Invalid numerical value for NUMBER setting type");
  }
  if (type === "JSON") {
    try {
      JSON.parse(stringValue);
    } catch {
      throw new Error("Invalid JSON string for JSON setting type");
    }
  }

  const previous = await prisma.systemSetting.findUnique({ where: { key } });

  const [updated] = await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key },
      update: { value: stringValue, type, updatedBy, description },
      create: { key, value: stringValue, type, updatedBy, description },
    }),
    prisma.auditLog.create({
      data: {
        adminId: updatedBy,
        action: "SYSTEM_SETTING_UPDATED",
        previousStatus: previous ? previous.value : "UNSET",
        newStatus: stringValue,
        reason: reason || `Updated system setting: ${key}`,
      },
    }),
  ]);

  // Invalidate cache immediately on update
  invalidateSystemSettingsCache();
  return updated;
}

export async function rollbackSystemSetting(key, adminId) {
  if (!key) throw new Error("Setting key required for rollback");

  const lastAudit = await prisma.auditLog.findFirst({
    where: { action: "SYSTEM_SETTING_UPDATED", reason: { contains: key } },
    orderBy: { timestamp: "desc" },
  });

  if (!lastAudit || lastAudit.previousStatus === "UNSET") {
    throw new Error(`No previous historical audit state found for setting: ${key}`);
  }

  return setSystemSetting(
    key,
    lastAudit.previousStatus,
    adminId,
    "STRING",
    "Rolled back to previous state",
    `Rollback setting ${key} to ${lastAudit.previousStatus}`
  );
}

async function refreshSettingsCache() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const newCache = new Map();
    for (const setting of settings) {
      newCache.set(setting.key, parseSettingValue(setting.value, setting.type));
    }
    settingsCache = newCache;
    lastFetchTime = Date.now();
  } catch (err) {
    console.error("Failed to refresh system settings cache:", err);
  }
}

function parseSettingValue(value, type) {
  if (type === "BOOLEAN") return value === "true" || value === "1";
  if (type === "NUMBER") return Number(value);
  if (type === "JSON") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}
