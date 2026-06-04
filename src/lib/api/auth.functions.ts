import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logAudit } from "../db.server";
import { DEMO_USERS } from "../store";

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string(),
      password: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    // Tạm thời vẫn dùng DEMO_USERS như trước
    const match = Object.values(DEMO_USERS).find(
      (u) => u.code.toLowerCase() === data.code.toLowerCase(),
    );
    if (!match) return { error: "Mã đăng nhập không tồn tại." };
    
    await logAudit("Đăng nhập", match.code);
    return { user: match };
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
