import type { Member, Role } from "./types";

export interface UserScope {
  role: Role;
  facultyId?: string;
  classId?: string;
  memberId?: string;
}

export function scopedMembers(all: Member[], u: UserScope): Member[] {
  switch (u.role) {
    case "admin":
    case "university_officer":
    case "inspection_officer":
    case "financial_officer":
      return all;
    case "faculty_officer":
      return all.filter((m) => m.facultyId === u.facultyId);
    case "class_secretary":
      return all.filter((m) => m.classId === u.classId);
    case "member":
      return all.filter((m) => m.id === u.memberId);
  }
}