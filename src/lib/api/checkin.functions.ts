import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma, logAudit } from "../db.server";

/**
 * Check-in a member for an event.
 *  1. Mark member as "attended" on the event.
 *  2. If not already registered, also register them.
 *  3. Automatically award +5 training points for attending.
 */
export const checkinMemberFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      eventId: z.string(),
      memberCode: z.string(), // QR payload is the member *code* (MaSV)
      actor: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // 1. Verify event exists
    const event = await prisma.eventItem.findUnique({
      where: { id: data.eventId },
      include: { attendedMembers: { select: { id: true, code: true } } },
    });
    if (!event) return { error: "Sự kiện không tồn tại." };

    // 2. Find member by code
    const member = await prisma.member.findUnique({
      where: { code: data.memberCode.trim() },
    });
    if (!member) return { error: `Không tìm thấy đoàn viên "${data.memberCode}".` };

    // 3. Check if already attended
    if (event.attendedMembers.some((m) => m.id === member.id)) {
      return { error: `${member.fullName} (${member.code}) đã được điểm danh rồi.`, alreadyCheckedIn: true };
    }

    // 4. Register + attend in one transaction
    await prisma.$transaction(async (tx) => {
      // Ensure registered
      await tx.eventItem.update({
        where: { id: data.eventId },
        data: { registeredMembers: { connect: { id: member.id } } },
      });
      // Mark attended
      await tx.eventItem.update({
        where: { id: data.eventId },
        data: { attendedMembers: { connect: { id: member.id } } },
      });

      // 5. Award training points (+bonusPoints per attendance)
      await tx.trainingLog.create({
        data: {
          memberId: member.id,
          date: new Date().toISOString().slice(0, 10),
          delta: event.bonusPoints,
          reason: `Tham gia sự kiện: ${event.title}`,
          type: "reward",
          createdBy: data.actor || "system/checkin",
        },
      });
      // Update score
      await tx.member.update({
        where: { id: member.id },
        data: {
          trainingScore: Math.max(0, Math.min(100, member.trainingScore + event.bonusPoints)),
        },
      });
    });

    await logAudit("QR Check-in", data.actor || "system", `${member.code} → ${event.title}`);

    return {
      success: true,
      member: { code: member.code, fullName: member.fullName },
      bonusPoints: event.bonusPoints,
    };
  });

/**
 * Get event info for the check-in page
 */
export const getEventForCheckinFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ eventId: z.string() }))
  .handler(async ({ data }) => {
    const event = await prisma.eventItem.findUnique({
      where: { id: data.eventId },
      include: {
        attendedMembers: { select: { id: true, code: true, fullName: true } },
        registeredMembers: { select: { id: true } },
      },
    });
    if (!event) return null;

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startAt: event.startAt,
      location: event.location,
      status: event.status,
      enableQr: event.enableQr,
      bonusPoints: event.bonusPoints,
      attendedCount: event.attendedMembers.length,
      registeredCount: event.registeredMembers.length,
      attendedMembers: event.attendedMembers,
    };
  });
