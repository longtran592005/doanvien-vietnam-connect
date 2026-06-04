import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Role } from "./types";

export interface User {
  id: string;
  code: string;
  name: string;
  role: Role;
  memberId?: string; // for "member" role, links to member record
  facultyId?: string;
  classId?: string;
}

export const DEMO_USERS: Record<Role, User> = {
  admin: { id: "u-admin", code: "ADMIN01", name: "Quản trị viên hệ thống", role: "admin" },
  university_officer: { id: "u-univ", code: "CB001", name: "Nguyễn Văn Trường", role: "university_officer" },
  faculty_officer: { id: "u-fac", code: "CB101", name: "Trần Thị Khoa", role: "faculty_officer", facultyId: "f1" },
  class_secretary: {
    id: "u-sec",
    code: "SV20210001",
    name: "Lê Minh Bí Thư",
    role: "class_secretary",
    classId: "c1",
    facultyId: "f1",
    memberId: "m1",
  },
  member: {
    id: "u-mem",
    code: "SV20210002",
    name: "Trần Thị Minh Chi",
    role: "member",
    classId: "c1",
    facultyId: "f1",
    memberId: "m2",
  },
  inspection_officer: { id: "u-insp", code: "CB201", name: "Phạm Thanh Kiểm", role: "inspection_officer" },
  financial_officer: { id: "u-fin", code: "CB301", name: "Hoàng Quỹ Đoàn", role: "financial_officer" },
};

export const DEFAULT_PWD = "TBU@2026";

interface StoreState {
  user: User | null;
  setUser: (u: User | null) => void;
  switchRole: (r: Role) => void;
}

const StoreCtx = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    try {
      const u = sessionStorage.getItem("tbu_user");
      if (u) setUserState(JSON.parse(u));
    } catch {}
  }, []);

  const setUser = (u: User | null) => {
    setUserState(u);
    try {
      if (u) sessionStorage.setItem("tbu_user", JSON.stringify(u));
      else sessionStorage.removeItem("tbu_user");
    } catch {}
  };

  const value: StoreState = useMemo(
    () => ({
      user,
      setUser,
      switchRole: (r) => {
        const u = DEMO_USERS[r];
        setUser(u);
      },
    }),
    [user],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}