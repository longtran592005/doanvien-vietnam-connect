import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma, logAudit } from "../db.server";

export const getAuditLogsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await prisma.auditLog.findMany({
    orderBy: { at: 'desc' },
    take: 500
  });
});

export const addAuditLogFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ action: z.string(), actor: z.string(), target: z.string().optional() }))
  .handler(async ({ data }) => {
    await logAudit(data.action, data.actor, data.target);
    return { success: true };
  });

export const getDashboardDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const [members, events, fees, feeCampaigns, faculties, classes, training, audit] = await Promise.all([
    prisma.member.findMany(),
    prisma.eventItem.findMany(),
    prisma.feeRecord.findMany(),
    prisma.feeCampaign.findMany({ where: { isArchived: false } }),
    prisma.faculty.findMany(),
    prisma.classUnit.findMany(),
    prisma.trainingLog.findMany(),
    prisma.auditLog.findMany({ orderBy: { at: 'desc' }, take: 50 }),
  ]);
  
  return {
    members,
    events: events.map(e => ({...e, registered: [] as string[], attended: [] as string[]})), // simplified for dashboard
    fees,
    feeCampaigns,
    faculties,
    classes,
    training,
    audit,
  };
});

export const getBackupDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const [members, events, audit] = await Promise.all([
    prisma.member.findMany(),
    prisma.eventItem.findMany(),
    prisma.auditLog.findMany({ orderBy: { at: 'desc' }, take: 100 }),
  ]);
  return {
    at: new Date().toISOString(),
    members,
    events,
    audit,
  };
});
