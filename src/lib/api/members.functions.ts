import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma, logAudit } from "../db.server";

export const getMembersFn = createServerFn({ method: "GET" }).handler(async () => {
  return await prisma.member.findMany();
});

export const getMemberByIdFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return await prisma.member.findUnique({ where: { id: data.id } });
  });

export const addMemberFn = createServerFn({ method: "POST" })
  .inputValidator(z.any())
  .handler(async ({ data }) => {
    // Generate id and mapping logic from simple frontend payload
    const { id, ...rest } = data;
    const newMember = await prisma.member.create({
      data: {
        ...rest,
      }
    });
    await logAudit("Thêm đoàn viên", "system", newMember.fullName);
    return { success: true, member: newMember };
  });

export const updateMemberFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), patch: z.any() }))
  .handler(async ({ data }) => {
    await prisma.member.update({
      where: { id: data.id },
      data: data.patch,
    });
    await logAudit("Cập nhật hồ sơ", "system", data.id);
    return { success: true };
  });
