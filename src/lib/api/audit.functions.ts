import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStore, logAudit } from "../db.server";

export const getAuditLogsFn = createServerFn({ method: "GET" }).handler(async () => {
  return getStore().audit;
});

// Used generally internally, but could be exposed via server functions if needed
export const addAuditLogFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ action: z.string(), actor: z.string(), target: z.string().optional() }))
  .handler(async ({ data }) => {
    logAudit(data.action, data.actor, data.target);
    return { success: true };
  });

export const getDashboardDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const store = getStore();
  return {
    members: store.members,
    events: store.events,
    fees: store.fees,
    faculties: store.faculties,
    classes: store.classes,
    training: store.training,
    audit: store.audit,
  };
});

export const getBackupDataFn = createServerFn({ method: "GET" }).handler(async () => {
  const store = getStore();
  return {
    members: store.members,
    events: store.events,
    fees: store.fees,
    faculties: store.faculties,
    classes: store.classes,
    audit: store.audit,
    training: store.training,
    at: new Date().toISOString()
  };
});
