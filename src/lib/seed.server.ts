import type { AuditLog, ClassUnit, EventItem, Faculty, FeeRecord, Member, TrainingLog } from "./types";

export function seedData() {
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

  return {
    faculties: FACULTIES,
    classes: CLASSES,
    members: INITIAL_MEMBERS,
    events: INITIAL_EVENTS,
    training: INITIAL_TRAINING,
    fees: INITIAL_FEES,
    audit: INITIAL_AUDIT,
  };
}
