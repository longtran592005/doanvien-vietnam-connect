import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  AuditLog,
  ClassUnit,
  EventItem,
  Faculty,
  FeeRecord,
  Member,
  Role,
  TrainingLog,
} from "./types";
import { classify } from "./types";

/* ----------------------------- SEED DATA ----------------------------- */
const FACULTIES: Faculty[] = [
  { id: "f1", code: "CNTT", name: "Khoa Công nghệ Thông tin" },
  { id: "f2", code: "KT", name: "Khoa Kinh tế" },
  { id: "f3", code: "NN", name: "Khoa Ngoại ngữ" },
  { id: "f4", code: "YD", name: "Khoa Y Dược" },
  { id: "f5", code: "SP", name: "Khoa Sư phạm" },
];

const CLASSES: ClassUnit[] = [
  { id: "c1", facultyId: "f1", name: "CNTT K62A" },
  { id: "c2", facultyId: "f1", name: "CNTT K62B" },
  { id: "c3", facultyId: "f1", name: "CNTT K63A" },
  { id: "c4", facultyId: "f2", name: "QTKD K62" },
  { id: "c5", facultyId: "f2", name: "Kế toán K63" },
  { id: "c6", facultyId: "f3", name: "Anh K62" },
  { id: "c7", facultyId: "f4", name: "Điều dưỡng K62" },
  { id: "c8", facultyId: "f5", name: "GD Tiểu học K62" },
];

const FIRST = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ"];
const MID = ["Văn", "Thị", "Minh", "Quang", "Thanh", "Hữu", "Xuân", "Thu"];
const LAST = ["An", "Bình", "Chi", "Dung", "Hà", "Hải", "Khánh", "Linh", "Mai", "Nam", "Phong", "Quân", "Sơn", "Trang", "Tuấn", "Vy"];
const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: T[]) => a[rand(a.length)];

function genMembers(): Member[] {
  const out: Member[] = [];
  let i = 1;
  for (const c of CLASSES) {
    const count = 8 + rand(6);
    for (let k = 0; k < count; k++) {
      const score = 55 + rand(45);
      out.push({
        id: `m${i}`,
        code: `SV${String(20210000 + i).padStart(8, "0")}`,
        fullName: `${pick(FIRST)} ${pick(MID)} ${pick(LAST)}`,
        dob: `200${2 + rand(4)}-0${1 + rand(9)}-1${rand(9)}`,
        gender: rand(2) === 0 ? "M" : "F",
        classId: c.id,
        facultyId: c.facultyId,
        phone: `09${rand(10)}${rand(10)}${rand(10)}${rand(10)}${rand(10)}${rand(10)}${rand(10)}${rand(10)}`,
        email: `sv${i}@tbu.edu.vn`,
        joinDate: "2022-09-15",
        partyStatus: score > 85 ? (rand(3) === 0 ? "aspirant" : "member") : "member",
        trainingScore: score,
        feePaid: rand(3) !== 0,
        role: "member",
      });
      i++;
    }
  }
  return out;
}

const INITIAL_MEMBERS = genMembers();

const INITIAL_EVENTS: EventItem[] = [
  {
    id: "e1",
    title: "Lễ kết nạp Đoàn viên mới 2026",
    description: "Lễ kết nạp đoàn viên mới khóa K65 toàn trường.",
    startAt: "2026-06-15T08:00",
    location: "Hội trường A — TBU",
    status: "approved",
    registered: INITIAL_MEMBERS.slice(0, 30).map((m) => m.id),
    attended: [],
    createdBy: "university",
  },
  {
    id: "e2",
    title: "Hiến máu nhân đạo",
    description: "Chiến dịch hiến máu tình nguyện toàn trường.",
    startAt: "2026-06-20T07:30",
    location: "Sân vận động TBU",
    status: "pending",
    registered: INITIAL_MEMBERS.slice(5, 20).map((m) => m.id),
    attended: [],
    createdBy: "faculty",
    facultyId: "f1",
  },
  {
    id: "e3",
    title: "Cuộc thi Olympic Tin học",
    description: "Cuộc thi học thuật cấp Khoa CNTT.",
    startAt: "2026-07-01T13:30",
    location: "Phòng máy B2.03",
    status: "pending",
    registered: [],
    attended: [],
    createdBy: "class",
    facultyId: "f1",
  },
];

const INITIAL_TRAINING: TrainingLog[] = [];
const INITIAL_FEES: FeeRecord[] = INITIAL_MEMBERS.map((m, idx) => ({
  id: `fee${idx}`,
  memberId: m.id,
  period: "2026-Q1",
  amount: 30000,
  paid: m.feePaid,
  paidAt: m.feePaid ? "2026-03-12" : undefined,
}));

const INITIAL_AUDIT: AuditLog[] = [
  { id: "a1", at: new Date().toISOString(), actor: "admin", action: "Khởi tạo hệ thống" },
];

/* ----------------------------- STORE ----------------------------- */
interface User {
  id: string;
  code: string;
  name: string;
  role: Role;
  memberId?: string; // for "member" role, links to member record
  facultyId?: string;
  classId?: string;
}

const DEMO_USERS: Record<Role, User> = {
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
    memberId: INITIAL_MEMBERS[0].id,
  },
  member: {
    id: "u-mem",
    code: "SV20210002",
    name: INITIAL_MEMBERS[1].fullName,
    role: "member",
    classId: INITIAL_MEMBERS[1].classId,
    facultyId: INITIAL_MEMBERS[1].facultyId,
    memberId: INITIAL_MEMBERS[1].id,
  },
  inspection_officer: { id: "u-insp", code: "CB201", name: "Phạm Thanh Kiểm", role: "inspection_officer" },
  financial_officer: { id: "u-fin", code: "CB301", name: "Hoàng Quỹ Đoàn", role: "financial_officer" },
};

interface StoreState {
  user: User | null;
  login: (code: string, password: string) => string | null; // returns error
  logout: () => void;
  switchRole: (r: Role) => void;
  changePassword: (oldP: string, newP: string) => string | null;
  resetPassword: (userCode: string) => void;

  faculties: Faculty[];
  classes: ClassUnit[];
  members: Member[];
  events: EventItem[];
  training: TrainingLog[];
  fees: FeeRecord[];
  audit: AuditLog[];

  addFaculty: (name: string, code: string) => void;
  renameFaculty: (id: string, name: string) => void;
  deleteFaculty: (id: string) => void;
  addClass: (name: string, facultyId: string) => void;
  renameClass: (id: string, name: string) => void;
  deleteClass: (id: string) => void;

  updateMember: (id: string, patch: Partial<Member>) => void;
  addMember: (m: Omit<Member, "id">) => void;

  addTrainingLog: (log: Omit<TrainingLog, "id">) => void;

  addEvent: (e: Omit<EventItem, "id" | "registered" | "attended">) => void;
  approveEvent: (id: string) => void;
  registerEvent: (eventId: string, memberId: string) => void;
  markAttended: (eventId: string, memberId: string) => void;

  toggleFee: (id: string) => void;

  log: (action: string, target?: string) => void;
}

const StoreCtx = createContext<StoreState | null>(null);

const PASSWORDS_KEY = "tbu_passwords_v1";
const DEFAULT_PWD = "TBU@2026";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>(FACULTIES);
  const [classes, setClasses] = useState<ClassUnit[]>(CLASSES);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [training, setTraining] = useState<TrainingLog[]>(INITIAL_TRAINING);
  const [fees, setFees] = useState<FeeRecord[]>(INITIAL_FEES);
  const [audit, setAudit] = useState<AuditLog[]>(INITIAL_AUDIT);
  const [passwords, setPasswords] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PASSWORDS_KEY);
      if (raw) setPasswords(JSON.parse(raw));
      const u = sessionStorage.getItem("tbu_user");
      if (u) setUser(JSON.parse(u));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    } catch {}
  }, [passwords]);

  useEffect(() => {
    try {
      if (user) sessionStorage.setItem("tbu_user", JSON.stringify(user));
      else sessionStorage.removeItem("tbu_user");
    } catch {}
  }, [user]);

  const log = (action: string, target?: string) => {
    setAudit((a) => [
      { id: `a${Date.now()}`, at: new Date().toISOString(), actor: user?.code ?? "system", action, target },
      ...a,
    ].slice(0, 500));
  };

  const value: StoreState = useMemo(
    () => ({
      user,
      login: (code, password) => {
        const match = Object.values(DEMO_USERS).find((u) => u.code.toLowerCase() === code.toLowerCase());
        if (!match) return "Mã đăng nhập không tồn tại.";
        const expected = passwords[match.code] ?? DEFAULT_PWD;
        if (password !== expected) return "Mật khẩu không đúng.";
        setUser(match);
        log("Đăng nhập", match.code);
        return null;
      },
      logout: () => {
        log("Đăng xuất", user?.code);
        setUser(null);
      },
      switchRole: (r) => {
        const u = DEMO_USERS[r];
        setUser(u);
        log("Chuyển vai trò (demo)", r);
      },
      changePassword: (oldP, newP) => {
        if (!user) return "Chưa đăng nhập";
        const current = passwords[user.code] ?? DEFAULT_PWD;
        if (oldP !== current) return "Mật khẩu hiện tại không đúng.";
        if (newP.length < 6) return "Mật khẩu mới phải có ít nhất 6 ký tự.";
        setPasswords({ ...passwords, [user.code]: newP });
        log("Đổi mật khẩu");
        return null;
      },
      resetPassword: (userCode) => {
        const p = { ...passwords };
        delete p[userCode];
        setPasswords(p);
        log("Đặt lại mật khẩu", userCode);
      },
      faculties,
      classes,
      members,
      events,
      training,
      fees,
      audit,
      addFaculty: (name, code) => {
        setFaculties((f) => [...f, { id: `f${Date.now()}`, name, code }]);
        log("Thêm khoa", name);
      },
      renameFaculty: (id, name) => {
        setFaculties((f) => f.map((x) => (x.id === id ? { ...x, name } : x)));
        log("Sửa khoa", name);
      },
      deleteFaculty: (id) => {
        setFaculties((f) => f.filter((x) => x.id !== id));
        log("Xóa khoa", id);
      },
      addClass: (name, facultyId) => {
        setClasses((c) => [...c, { id: `c${Date.now()}`, name, facultyId }]);
        log("Thêm lớp", name);
      },
      renameClass: (id, name) => {
        setClasses((c) => c.map((x) => (x.id === id ? { ...x, name } : x)));
        log("Sửa lớp", name);
      },
      deleteClass: (id) => {
        setClasses((c) => c.filter((x) => x.id !== id));
        log("Xóa lớp", id);
      },
      updateMember: (id, patch) => {
        setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
        log("Cập nhật hồ sơ", id);
      },
      addMember: (m) => {
        setMembers((ms) => [...ms, { ...m, id: `m${Date.now()}` }]);
        log("Thêm đoàn viên", m.fullName);
      },
      addTrainingLog: (l) => {
        setTraining((t) => [{ ...l, id: `t${Date.now()}` }, ...t]);
        setMembers((ms) =>
          ms.map((m) =>
            m.id === l.memberId
              ? { ...m, trainingScore: Math.max(0, Math.min(100, m.trainingScore + l.delta)) }
              : m,
          ),
        );
        log(l.type === "reward" ? "Cộng điểm rèn luyện" : "Trừ điểm rèn luyện", l.memberId);
      },
      addEvent: (e) => {
        setEvents((es) => [...es, { ...e, id: `e${Date.now()}`, registered: [], attended: [] }]);
        log("Tạo hoạt động", e.title);
      },
      approveEvent: (id) => {
        setEvents((es) => es.map((e) => (e.id === id ? { ...e, status: "approved" } : e)));
        log("Phê duyệt hoạt động", id);
      },
      registerEvent: (eventId, memberId) => {
        setEvents((es) =>
          es.map((e) =>
            e.id === eventId && !e.registered.includes(memberId)
              ? { ...e, registered: [...e.registered, memberId] }
              : e,
          ),
        );
        log("Đăng ký hoạt động", eventId);
      },
      markAttended: (eventId, memberId) => {
        setEvents((es) =>
          es.map((e) =>
            e.id === eventId && !e.attended.includes(memberId)
              ? { ...e, attended: [...e.attended, memberId] }
              : e,
          ),
        );
        log("Điểm danh", `${eventId}/${memberId}`);
      },
      toggleFee: (id) => {
        setFees((fs) =>
          fs.map((f) =>
            f.id === id
              ? { ...f, paid: !f.paid, paidAt: !f.paid ? new Date().toISOString().slice(0, 10) : undefined }
              : f,
          ),
        );
        log("Cập nhật đoàn phí", id);
      },
      log,
    }),
    [user, faculties, classes, members, events, training, fees, audit, passwords],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}

export { DEFAULT_PWD, DEMO_USERS };
export { classify } from "./types";