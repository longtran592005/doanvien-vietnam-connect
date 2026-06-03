import type { Role } from "./types";

export const can = (role: Role | undefined, action: string): boolean => {
  if (!role) return false;
  const map: Record<string, Role[]> = {
    "org.manage": ["admin", "university_officer"],
    "members.viewAll": ["admin", "university_officer", "inspection_officer", "financial_officer"],
    "members.viewFaculty": ["faculty_officer"],
    "members.viewClass": ["class_secretary"],
    "members.edit": ["admin", "university_officer", "faculty_officer", "class_secretary"],
    "training.grade": ["admin", "university_officer", "faculty_officer", "class_secretary"],
    "events.create": ["admin", "university_officer", "faculty_officer", "class_secretary"],
    "events.approve": ["admin", "university_officer", "faculty_officer"],
    "fees.manage": ["admin", "financial_officer"],
    "fees.view": ["admin", "financial_officer", "university_officer", "inspection_officer"],
    "reports.view": ["admin", "university_officer", "inspection_officer", "financial_officer"],
    "audit.view": ["admin", "inspection_officer"],
    "system.admin": ["admin"],
  };
  return map[action]?.includes(role) ?? false;
};