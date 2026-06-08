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

export const createFeeCampaignFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    title: z.string(),
    description: z.string().optional(),
    amount: z.number(),
    targetType: z.enum(["all", "faculty", "class"]),
    targetIds: z.array(z.string()).optional(),
    actor: z.string().optional()
  }))
  .handler(async ({ data }) => {
    const targetIdsStr = data.targetIds && data.targetIds.length > 0 ? JSON.stringify(data.targetIds) : null;
    
    const campaign = await prisma.feeCampaign.create({
      data: {
        title: data.title,
        description: data.description || null,
        amount: data.amount,
        targetType: data.targetType,
        targetIds: targetIdsStr,
        createdAt: new Date().toISOString(),
        createdBy: data.actor || "system"
      }
    });

    let memberWhere = {};
    if (data.targetType === "faculty" && data.targetIds && data.targetIds.length > 0) {
      memberWhere = { facultyId: { in: data.targetIds } };
    } else if (data.targetType === "class" && data.targetIds && data.targetIds.length > 0) {
      memberWhere = { classId: { in: data.targetIds } };
    }
    
    const members = await prisma.member.findMany({ where: memberWhere, select: { id: true } });
    
    if (members.length > 0) {
      await prisma.feeRecord.createMany({
        data: members.map(m => ({
          memberId: m.id,
          campaignId: campaign.id,
          amount: data.amount,
          paid: false
        }))
      });
    }

    await logAudit("Tạo đợt thu đoàn phí mới", data.actor || "system", campaign.id);
    return { success: true, campaign };
  });

export const archiveFeeCampaignFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), actor: z.string().optional() }))
  .handler(async ({ data }) => {
    await prisma.feeCampaign.update({
      where: { id: data.id },
      data: { isArchived: true }
    });
    await logAudit("Ẩn đợt thu đoàn phí", data.actor || "system", data.id);
    return { success: true };
  });
