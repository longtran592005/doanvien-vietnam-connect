import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma, logAudit } from "../db.server";

export const getTrainingLogsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await prisma.trainingLog.findMany({ orderBy: { date: 'desc' } });
});

export const addTrainingLogFn = createServerFn({ method: "POST" })
  .inputValidator(z.any())
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    await prisma.trainingLog.create({
      data: {
        ...rest
      }
    });
    
    // Update member's score
    const member = await prisma.member.findUnique({ where: { id: data.memberId } });
    if (member) {
      await prisma.member.update({
        where: { id: data.memberId },
        data: { trainingScore: Math.max(0, Math.min(100, member.trainingScore + data.delta)) }
      });
    }
    
    await logAudit(data.type === "reward" ? "Cộng điểm rèn luyện" : "Trừ điểm rèn luyện", data.createdBy || "system", data.memberId);
    return { success: true };
  });
