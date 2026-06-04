import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma, logAudit } from "../db.server";

export const getEventsFn = createServerFn({ method: "GET" }).handler(async () => {
  const events = await prisma.eventItem.findMany({
    include: {
      registeredMembers: { select: { id: true } },
      attendedMembers: { select: { id: true } }
    }
  });
  // Map Prisma result back to frontend expected structure
  return events.map(e => ({
    ...e,
    registered: e.registeredMembers.map(m => m.id),
    attended: e.attendedMembers.map(m => m.id),
  }));
});

export const addEventFn = createServerFn({ method: "POST" })
  .inputValidator(z.any())
  .handler(async ({ data }) => {
    const newEvent = await prisma.eventItem.create({
      data: {
        title: data.title,
        description: data.description,
        startAt: data.startAt,
        location: data.location,
        status: data.status,
        createdBy: data.createdBy || "system",
        facultyId: data.facultyId,
      }
    });
    await logAudit("Tạo hoạt động", data.createdBy || "system", newEvent.title);
    return { success: true };
  });

export const approveEventFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string(), actor: z.string().optional() }))
  .handler(async ({ data }) => {
    await prisma.eventItem.update({
      where: { id: data.id },
      data: { status: "approved" }
    });
    await logAudit("Phê duyệt hoạt động", data.actor || "system", data.id);
    return { success: true };
  });

export const registerEventFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ eventId: z.string(), memberId: z.string() }))
  .handler(async ({ data }) => {
    await prisma.eventItem.update({
      where: { id: data.eventId },
      data: {
        registeredMembers: {
          connect: { id: data.memberId }
        }
      }
    });
    await logAudit("Đăng ký hoạt động", data.memberId, data.eventId);
    return { success: true };
  });

export const markAttendedFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ eventId: z.string(), memberId: z.string() }))
  .handler(async ({ data }) => {
    await prisma.eventItem.update({
      where: { id: data.eventId },
      data: {
        attendedMembers: {
          connect: { id: data.memberId }
        }
      }
    });
    await logAudit("Điểm danh", data.memberId, `${data.eventId}/${data.memberId}`);
    return { success: true };
  });
