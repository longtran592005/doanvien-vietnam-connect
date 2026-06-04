import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStore, logAudit } from "../db.server";
import type { TrainingLog } from "../types";

export const getTrainingLogsFn = createServerFn({ method: "GET" }).handler(async () => {
  return getStore().training;
});

export const addTrainingLogFn = createServerFn({ method: "POST" })
  .inputValidator(z.any())
  .handler(async ({ data }) => {
    const store = getStore();
    const newLog = { ...data, id: `t${Date.now()}` } as TrainingLog;
    store.training.unshift(newLog);
    
    // Update member's score
    store.members = store.members.map((m) =>
      m.id === data.memberId
        ? { ...m, trainingScore: Math.max(0, Math.min(100, m.trainingScore + data.delta)) }
        : m,
    );
    
    logAudit(data.type === "reward" ? "Cộng điểm rèn luyện" : "Trừ điểm rèn luyện", data.createdBy || "system", data.memberId);
    return { success: true };
  });
