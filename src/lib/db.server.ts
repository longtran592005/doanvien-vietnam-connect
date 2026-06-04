import type { AuditLog, ClassUnit, EventItem, Faculty, FeeRecord, Member, TrainingLog } from "./types";
import { seedData } from "./seed.server";

export interface DataStore {
  faculties: Faculty[];
  classes: ClassUnit[];
  members: Member[];
  events: EventItem[];
  training: TrainingLog[];
  fees: FeeRecord[];
  audit: AuditLog[];
}

let store: DataStore | null = null;

export function getStore(): DataStore {
  if (!store) {
    store = seedData();
  }
  return store;
}

export function logAudit(action: string, actor: string, target?: string) {
  const s = getStore();
  s.audit.unshift({
    id: `a${Date.now()}`,
    at: new Date().toISOString(),
    actor,
    action,
    target,
  });
  if (s.audit.length > 500) {
    s.audit = s.audit.slice(0, 500);
  }
}
