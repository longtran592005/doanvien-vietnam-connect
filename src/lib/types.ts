export type Role =
  | "admin"
  | "university_officer"
  | "faculty_officer"
  | "class_secretary"
  | "member"
  | "inspection_officer"
  | "financial_officer";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Quản trị viên",
  university_officer: "Cán bộ Đoàn trường",
  faculty_officer: "Cán bộ Liên chi đoàn",
  class_secretary: "Bí thư Chi đoàn",
  member: "Đoàn viên",
  inspection_officer: "Cán bộ Kiểm tra/Thống kê",
  financial_officer: "Cán bộ Tài chính",
};

export type PartyStatus = "member" | "aspirant" | "party_member";
export const PARTY_LABELS: Record<PartyStatus, string> = {
  member: "Đoàn viên",
  aspirant: "Cảm tình Đảng",
  party_member: "Đảng viên",
};

export type TrainingClassification = "excellent" | "good" | "average" | "poor";
export const CLASSIFICATION_LABELS: Record<TrainingClassification, string> = {
  excellent: "Xuất sắc",
  good: "Khá",
  average: "Trung bình",
  poor: "Yếu",
};

export interface Faculty {
  id: string;
  name: string;
  code: string;
}

export interface ClassUnit {
  id: string;
  name: string;
  facultyId: string;
}

export interface Member {
  id: string;
  code: string; // Mã sinh viên / mã giảng viên
  fullName: string;
  dob: string;
  gender: "M" | "F";
  classId: string;
  facultyId: string;
  phone: string;
  email: string;
  joinDate: string;
  partyStatus: PartyStatus;
  trainingScore: number;
  feePaid: boolean;
  role: Role;
  // 2C extended
  family?: string;
  socialRelationships?: string;
  academicHistory?: string;
  itSkills?: string;
  languages?: string;
  awards?: string;
  disciplines?: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  startAt: string;
  location: string;
  status: "draft" | "pending" | "approved" | "completed";
  registered: string[];
  attended: string[];
  createdBy: string;
  facultyId?: string;
}

export interface TrainingLog {
  id: string;
  memberId: string;
  date: string;
  delta: number;
  reason: string;
  type: "reward" | "violation";
  createdBy: string;
}

export interface FeeRecord {
  id: string;
  memberId: string;
  period: string; // e.g. 2024-Q4
  amount: number;
  paid: boolean;
  paidAt?: string;
}

export interface AuditLog {
  id: string;
  at: string;
  actor: string;
  action: string;
  target?: string;
}

export function classify(score: number): TrainingClassification {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 50) return "average";
  return "poor";
}