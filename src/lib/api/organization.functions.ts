import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma, logAudit } from "../db.server";

export const getFacultiesFn = createServerFn({ method: "GET" }).handler(async () => {
  return await prisma.faculty.findMany();
});

export const addFacultyFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string(), code: z.string() }))
  .handler(async ({ data }) => {
    await prisma.faculty.create({ data: { name: data.name, code: data.code } });
    await logAudit("Thêm khoa", "system", data.name);
    return { success: true };
  });

export const renameFacultyFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), name: z.string() }))
  .handler(async ({ data }) => {
    await prisma.faculty.update({ where: { id: data.id }, data: { name: data.name } });
    await logAudit("Sửa khoa", "system", data.name);
    return { success: true };
  });

export const deleteFacultyFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    try {
      await prisma.faculty.delete({ where: { id: data.id } });
      await logAudit("Xóa khoa", "system", data.id);
      return { success: true };
    } catch (e: any) {
      if (e.code === 'P2003') return { error: "Không thể xóa khoa đang có lớp hoặc đoàn viên." };
      return { error: "Lỗi hệ thống khi xóa khoa" };
    }
  });

export const getClassesFn = createServerFn({ method: "GET" }).handler(async () => {
  return await prisma.classUnit.findMany();
});

export const addClassFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string(), facultyId: z.string() }))
  .handler(async ({ data }) => {
    await prisma.classUnit.create({ data: { name: data.name, facultyId: data.facultyId } });
    await logAudit("Thêm lớp", "system", data.name);
    return { success: true };
  });

export const renameClassFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), name: z.string() }))
  .handler(async ({ data }) => {
    await prisma.classUnit.update({ where: { id: data.id }, data: { name: data.name } });
    await logAudit("Sửa lớp", "system", data.name);
    return { success: true };
  });

export const deleteClassFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    try {
      await prisma.classUnit.delete({ where: { id: data.id } });
      await logAudit("Xóa lớp", "system", data.id);
      return { success: true };
    } catch (e: any) {
      if (e.code === 'P2003') return { error: "Không thể xóa lớp đang có đoàn viên." };
      return { error: "Lỗi hệ thống khi xóa lớp" };
    }
  });
