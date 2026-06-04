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
export const addBulkTrainingLogFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    memberIds: z.array(z.string()),
    date: z.string(),
    delta: z.number(),
    reason: z.string(),
    type: z.string(),
    createdBy: z.string()
  }))
  .handler(async ({ data }) => {
    const { memberIds, ...rest } = data;
    
    // Sử dụng transaction để đảm bảo toàn vẹn
    await prisma.$transaction(async (tx) => {
      // 1. Tạo nhiều bản ghi log
      const logs = memberIds.map(memberId => ({
        ...rest,
        memberId
      }));
      await tx.trainingLog.createMany({
        data: logs
      });

      // 2. Cập nhật điểm cho từng người
      // Prisma SQLite hiện chưa hỗ trợ updateMany với tính toán toán học (increment/decrement) có min/max an toàn nếu điểm khác nhau
      // Do đó, ta lặp qua để cập nhật
      const members = await tx.member.findMany({
        where: { id: { in: memberIds } }
      });
      
      for (const m of members) {
        await tx.member.update({
          where: { id: m.id },
          data: { trainingScore: Math.max(0, Math.min(100, m.trainingScore + data.delta)) }
        });
      }
    });
    
    await logAudit(data.type === "reward" ? "Cộng điểm rèn luyện (nhóm)" : "Trừ điểm rèn luyện (nhóm)", data.createdBy || "system", `Cho ${memberIds.length} đoàn viên`);
    return { success: true };
  });
