import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma, logAudit } from "../db.server";
import { DEMO_USERS } from "../store";

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string(),
      password: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const account = await prisma.account.findUnique({
      where: { code: data.code.toUpperCase() }
    });

    if (!account) return { error: "Mã đăng nhập không tồn tại." };
    if (account.password !== data.password) return { error: "Mật khẩu không chính xác." };
    if (account.isLocked) return { error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." };

    await logAudit("Đăng nhập", account.code);

    return {
      user: {
        id: account.id,
        code: account.code,
        name: account.name,
        role: account.role as any,
        memberId: account.memberId || undefined,
        facultyId: account.facultyId || undefined,
        classId: account.classId || undefined,
      }
    };
  });

export const logoutFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string().optional() }))
  .handler(async ({ data }) => {
    await logAudit("Đăng xuất", data.code || "system");
    return { success: true };
  });

export const changePasswordFn = createServerFn({ method: "POST" })
  .handler(async () => {
    await logAudit("Đổi mật khẩu", "user");
    return { success: true };
  });
