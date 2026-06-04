import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStore, logAudit } from "../db.server";
import type { Member } from "../types";

export const getMembersFn = createServerFn({ method: "GET" }).handler(async () => {
  return getStore().members;
});

export const getMemberByIdFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return getStore().members.find((m) => m.id === data.id);
  });

export const addMemberFn = createServerFn({ method: "POST" })
  .inputValidator(z.any()) // Using any for simplicity in this migration
  .handler(async ({ data }) => {
    const store = getStore();
    const newMember = { ...data, id: `m${Date.now()}` } as Member;
    store.members.push(newMember);
    logAudit("Thêm đoàn viên", "system", newMember.fullName);
    return { success: true, member: newMember };
  });

export const updateMemberFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), patch: z.any() }))
  .handler(async ({ data }) => {
    const store = getStore();
    store.members = store.members.map((m) => (m.id === data.id ? { ...m, ...data.patch } : m));
    logAudit("Cập nhật hồ sơ", "system", data.id);
    return { success: true };
  });
