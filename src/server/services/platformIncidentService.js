import { prisma } from "../db/prisma.js";
import { getSystemHealthStatus } from "./systemMonitoringService.js";

export const INCIDENT_SEVERITY = {
  SEV1_CRITICAL: "SEV1_CRITICAL",
  SEV2_MAJOR: "SEV2_MAJOR",
  SEV3_MINOR: "SEV3_MINOR",
};

export const INCIDENT_STATUS = {
  INVESTIGATING: "INVESTIGATING",
  IDENTIFIED: "IDENTIFIED",
  MONITORING: "MONITORING",
  RESOLVED: "RESOLVED",
};

export async function declareIncident(incidentData, adminId) {
  const { title, severity, summary, affectedArea } = incidentData;
  if (!title || !severity || !summary || !affectedArea) {
    throw new Error("Missing required incident fields (title, severity, summary, affectedArea)");
  }

  return prisma.$transaction(async (tx) => {
    const incident = await tx.platformIncident.create({
      data: {
        title: title.trim(),
        severity,
        status: INCIDENT_STATUS.INVESTIGATING,
        summary: summary.trim(),
        affectedArea,
        declaredBy: adminId,
      },
    });

    const auditClient = tx.auditLog || prisma.auditLog;
    if (auditClient?.create) {
      await auditClient.create({
        data: {
          adminId,
          action: "INCIDENT_DECLARED",
          previousStatus: "NONE",
          newStatus: severity,
          reason: `Declared ${severity} incident: ${title}`,
        },
      });
    }

    return incident;
  });
}

export async function updateIncidentStatus(incidentId, status, summary, adminId) {
  const existing = await prisma.platformIncident.findUnique({ where: { id: incidentId } });
  if (!existing) throw new Error("Incident not found");

  const isResolving = status === INCIDENT_STATUS.RESOLVED;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.platformIncident.update({
      where: { id: incidentId },
      data: {
        status,
        ...(summary && { summary: summary.trim() }),
        ...(isResolving && { resolvedAt: new Date() }),
      },
    });

    const auditClient = tx.auditLog || prisma.auditLog;
    if (auditClient?.create) {
      await auditClient.create({
        data: {
          adminId,
          action: "INCIDENT_STATUS_UPDATED",
          previousStatus: existing.status,
          newStatus: status,
          reason: `Updated incident ${incidentId} to ${status}`,
        },
      });
    }

    return updated;
  });
}

export async function getActiveIncidents() {
  const incidents = await prisma.platformIncident.findMany({
    where: { status: { not: INCIDENT_STATUS.RESOLVED } },
    orderBy: { createdAt: "desc" },
  });

  const health = await getSystemHealthStatus();
  return { incidents, health };
}
