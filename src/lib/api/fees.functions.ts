import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma, logAudit } from "../db.server";

export const getFeesFn = createServerFn({ method: "GET" }).handler(async () => {
  return await prisma.feeRecord.findMany();
});

export const toggleFeeFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), actor: z.string().optional() }))
  .handler(async ({ data }) => {
    const fee = await prisma.feeRecord.findUnique({ where: { id: data.id }});
    if (!fee) return { error: "Not found" };
    
    await prisma.feeRecord.update({
      where: { id: data.id },
      data: {
        paid: !fee.paid,
        paidAt: !fee.paid ? new Date().toISOString().slice(0, 10) : null
      }
    });
    
    await logAudit("Cập nhật đoàn phí", data.actor || "system", data.id);
    return { success: true };
  });
