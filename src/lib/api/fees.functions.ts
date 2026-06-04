import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStore, logAudit } from "../db.server";

export const getFeesFn = createServerFn({ method: "GET" }).handler(async () => {
  return getStore().fees;
});

export const toggleFeeFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), actor: z.string().optional() }))
  .handler(async ({ data }) => {
    const store = getStore();
    store.fees = store.fees.map((f) =>
      f.id === data.id
        ? { ...f, paid: !f.paid, paidAt: !f.paid ? new Date().toISOString().slice(0, 10) : undefined }
        : f,
    );
    logAudit("Cập nhật đoàn phí", data.actor || "system", data.id);
    return { success: true };
  });
