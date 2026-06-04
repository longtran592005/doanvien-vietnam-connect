import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStore, logAudit } from "../db.server";
import type { EventItem } from "../types";

export const getEventsFn = createServerFn({ method: "GET" }).handler(async () => {
  return getStore().events;
});

export const addEventFn = createServerFn({ method: "POST" })
  .inputValidator(z.any())
  .handler(async ({ data }) => {
    const store = getStore();
    const newEvent = { ...data, id: `e${Date.now()}`, registered: [], attended: [] } as EventItem;
    store.events.push(newEvent);
    logAudit("Tạo hoạt động", data.createdBy || "system", newEvent.title);
    return { success: true };
  });

export const approveEventFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), actor: z.string().optional() }))
  .handler(async ({ data }) => {
    const store = getStore();
    store.events = store.events.map((e) => (e.id === data.id ? { ...e, status: "approved" } : e));
    logAudit("Phê duyệt hoạt động", data.actor || "system", data.id);
    return { success: true };
  });

export const registerEventFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ eventId: z.string(), memberId: z.string() }))
  .handler(async ({ data }) => {
    const store = getStore();
    store.events = store.events.map((e) =>
      e.id === data.eventId && !e.registered.includes(data.memberId)
        ? { ...e, registered: [...e.registered, data.memberId] }
        : e,
    );
    logAudit("Đăng ký hoạt động", data.memberId, data.eventId);
    return { success: true };
  });

export const markAttendedFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ eventId: z.string(), memberId: z.string() }))
  .handler(async ({ data }) => {
    const store = getStore();
    store.events = store.events.map((e) =>
      e.id === data.eventId && !e.attended.includes(data.memberId)
        ? { ...e, attended: [...e.attended, data.memberId] }
        : e,
    );
    logAudit("Điểm danh", data.memberId, `${data.eventId}/${data.memberId}`);
    return { success: true };
  });
