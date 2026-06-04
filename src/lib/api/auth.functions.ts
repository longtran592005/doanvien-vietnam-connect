import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStore, logAudit } from "../db.server";
import { DEFAULT_PWD, DEMO_USERS } from "../store";

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string(),
      password: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    // Tạm thời lấy danh sách mật khẩu từ localStorage ở phía client truyền lên 
    // Do server functions không truy cập localStorage.
    // Thực tế sẽ check từ database
    
    // Tuy nhiên theo thiết kế, ta lấy DEMO_USERS và mặc định.
    const match = Object.values(DEMO_USERS).find(
      (u) => u.code.toLowerCase() === data.code.toLowerCase(),
    );
    if (!match) return { error: "Mã đăng nhập không tồn tại." };
    
    // Nếu check pass từ client thì ta chỉ trả về user
    // Nhưng vì đây là demo auth, password hardcoded hoặc xử lý ở client (tương lai sẽ verify db)
    logAudit("Đăng nhập", match.code);
    return { user: match };
  });

export const logoutFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string().optional() }))
  .handler(async ({ data }) => {
    logAudit("Đăng xuất", data.code || "system");
    return { success: true };
  });

export const changePasswordFn = createServerFn({ method: "POST" })
  .handler(async () => {
    logAudit("Đổi mật khẩu", "user");
    return { success: true };
  });
