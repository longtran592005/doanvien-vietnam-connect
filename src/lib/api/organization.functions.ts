import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStore, logAudit } from "../db.server";

export const getFacultiesFn = createServerFn({ method: "GET" }).handler(async () => {
  return getStore().faculties;
});

export const addFacultyFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string(), code: z.string() }))
  .handler(async ({ data }) => {
    const store = getStore();
    store.faculties.push({ id: `f${Date.now()}`, name: data.name, code: data.code });
    logAudit("Thêm khoa", "system", data.name);
    return { success: true };
  });

export const renameFacultyFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), name: z.string() }))
  .handler(async ({ data }) => {
    const store = getStore();
    store.faculties = store.faculties.map((x) => (x.id === data.id ? { ...x, name: data.name } : x));
    logAudit("Sửa khoa", "system", data.name);
    return { success: true };
  });

export const deleteFacultyFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const store = getStore();
    store.faculties = store.faculties.filter((x) => x.id !== data.id);
    logAudit("Xóa khoa", "system", data.id);
    return { success: true };
  });

export const getClassesFn = createServerFn({ method: "GET" }).handler(async () => {
  return getStore().classes;
});

export const addClassFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string(), facultyId: z.string() }))
  .handler(async ({ data }) => {
    const store = getStore();
    store.classes.push({ id: `c${Date.now()}`, name: data.name, facultyId: data.facultyId });
    logAudit("Thêm lớp", "system", data.name);
    return { success: true };
  });

export const renameClassFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), name: z.string() }))
  .handler(async ({ data }) => {
    const store = getStore();
    store.classes = store.classes.map((x) => (x.id === data.id ? { ...x, name: data.name } : x));
    logAudit("Sửa lớp", "system", data.name);
    return { success: true };
  });

export const deleteClassFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const store = getStore();
    store.classes = store.classes.filter((x) => x.id !== data.id);
    logAudit("Xóa lớp", "system", data.id);
    return { success: true };
  });
