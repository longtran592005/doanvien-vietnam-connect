import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma, logAudit } from "../db.server";

export const getAccountsFn = createServerFn({ method: "GET" }).handler(async () => {
  return await prisma.account.findMany({
    orderBy: { createdAt: 'desc' }
  });
});

export const createAccountFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    code: z.string(),
    name: z.string(),
    role: z.string(),
    password: z.string().optional(),
    memberId: z.string().optional().nullable(),
    facultyId: z.string().optional().nullable(),
    classId: z.string().optional().nullable(),
  }))
  .handler(async ({ data }) => {
    try {
      const newAccount = await prisma.account.create({
        data: {
          code: data.code,
          name: data.name,
          role: data.role,
          password: data.password || "TBU@2026",
          memberId: data.memberId || null,
          facultyId: data.facultyId || null,
          classId: data.classId || null,
          createdAt: new Date().toISOString()
        }
      });
      await logAudit("Thêm tài khoản", "system", newAccount.code);
      return { success: true, account: newAccount };
    } catch (e: any) {
      if (e.code === 'P2002') return { error: "Mã đăng nhập đã tồn tại trong hệ thống." };
      return { error: "Lỗi hệ thống khi thêm tài khoản." };
    }
  });

export const updateAccountFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), patch: z.any() }))
  .handler(async ({ data }) => {
    try {
      await prisma.account.update({
        where: { id: data.id },
        data: data.patch,
      });
      await logAudit("Cập nhật tài khoản", "system", data.id);
      return { success: true };
    } catch(e: any) {
      if (e.code === 'P2002') return { error: "Mã đăng nhập đã tồn tại trong hệ thống." };
      return { error: "Lỗi hệ thống khi cập nhật tài khoản." };
    }
  });

export const deleteAccountFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await prisma.account.delete({ where: { id: data.id } });
    await logAudit("Xóa tài khoản", "system", data.id);
    return { success: true };
  });

export const toggleLockAccountFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), isLocked: z.boolean() }))
  .handler(async ({ data }) => {
    await prisma.account.update({
      where: { id: data.id },
      data: { isLocked: data.isLocked }
    });
    await logAudit(data.isLocked ? "Khóa tài khoản" : "Mở khóa tài khoản", "system", data.id);
    return { success: true };
  });
