import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FACULTIES = [
  { id: "f1", code: "CNTT", name: "Khoa Công nghệ Thông tin" },
  { id: "f2", code: "KT", name: "Khoa Kinh tế" },
  { id: "f3", code: "NN", name: "Khoa Ngoại ngữ" },
  { id: "f4", code: "YD", name: "Khoa Y Dược" },
  { id: "f5", code: "SP", name: "Khoa Sư phạm" },
];

const CLASSES = [
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

function genMembers() {
  const out = [];
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

const INITIAL_EVENTS = [
  {
    id: "e1",
    title: "Lễ kết nạp Đoàn viên mới 2026",
    description: "Lễ kết nạp đoàn viên mới khóa K65 toàn trường.",
    startAt: "2026-06-15T08:00",
    location: "Hội trường A — TBU",
    status: "approved",
    createdBy: "university",
    registeredIds: INITIAL_MEMBERS.slice(0, 30).map((m) => m.id),
  },
  {
    id: "e2",
    title: "Hiến máu nhân đạo",
    description: "Chiến dịch hiến máu tình nguyện toàn trường.",
    startAt: "2026-06-20T07:30",
    location: "Sân vận động TBU",
    status: "pending",
    createdBy: "faculty",
    facultyId: "f1",
    registeredIds: INITIAL_MEMBERS.slice(5, 20).map((m) => m.id),
  },
  {
    id: "e3",
    title: "Cuộc thi Olympic Tin học",
    description: "Cuộc thi học thuật cấp Khoa CNTT.",
    startAt: "2026-07-01T13:30",
    location: "Phòng máy B2.03",
    status: "pending",
    createdBy: "class",
    facultyId: "f1",
    registeredIds: [],
  },
];

const INITIAL_CAMPAIGNS = [
  {
    id: "camp1",
    title: "Đoàn phí Học kỳ 1 năm 2026",
    description: "Thu đoàn phí đợt 1 toàn trường.",
    amount: 30000,
    targetType: "all",
    targetIds: null,
    isArchived: false,
    createdAt: new Date().toISOString(),
    createdBy: "admin",
  }
];

const INITIAL_FEES = INITIAL_MEMBERS.map((m, idx) => ({
  id: `fee${idx}`,
  memberId: m.id,
  campaignId: "camp1",
  amount: 30000,
  paid: m.feePaid,
  paidAt: m.feePaid ? "2026-03-12" : null,
}));

const INITIAL_AUDIT = [
  { id: "a1", at: new Date().toISOString(), actor: "admin", action: "Khởi tạo hệ thống", target: "" },
];

const INITIAL_ACCOUNTS = [
  { id: "u-admin", code: "ADMIN01", name: "Quản trị viên hệ thống", role: "admin", password: "TBU@2026", createdAt: new Date().toISOString() },
  { id: "u-univ", code: "CB001", name: "Nguyễn Văn Trường", role: "university_officer", password: "TBU@2026", createdAt: new Date().toISOString() },
  { id: "u-fac", code: "CB101", name: "Trần Thị Khoa", role: "faculty_officer", password: "TBU@2026", facultyId: "f1", createdAt: new Date().toISOString() },
  { id: "u-sec", code: "SV20210001", name: "Lê Minh Bí Thư", role: "class_secretary", password: "TBU@2026", classId: "c1", facultyId: "f1", memberId: "m1", createdAt: new Date().toISOString() },
  { id: "u-mem", code: "SV20210002", name: "Trần Thị Minh Chi", role: "member", password: "TBU@2026", classId: "c1", facultyId: "f1", memberId: "m2", createdAt: new Date().toISOString() },
  { id: "u-insp", code: "CB201", name: "Phạm Thanh Kiểm", role: "inspection_officer", password: "TBU@2026", createdAt: new Date().toISOString() },
  { id: "u-fin", code: "CB301", name: "Hoàng Quỹ Đoàn", role: "financial_officer", password: "TBU@2026", createdAt: new Date().toISOString() },
];

async function main() {
  console.log("Seeding faculties...");
  for (const f of FACULTIES) {
    await prisma.faculty.upsert({
      where: { id: f.id },
      update: {},
      create: f,
    })
  }

  console.log("Seeding classes...");
  for (const c of CLASSES) {
    await prisma.classUnit.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    })
  }

  console.log("Seeding members...");
  for (const m of INITIAL_MEMBERS) {
    await prisma.member.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    })
  }

  console.log("Seeding events...");
  for (const e of INITIAL_EVENTS) {
    const { registeredIds, ...eventData } = e;
    await prisma.eventItem.upsert({
      where: { id: e.id },
      update: {},
      create: {
        ...eventData,
        registeredMembers: {
          connect: registeredIds.map(id => ({ id }))
        }
      },
    })
  }

  console.log("Seeding fee campaigns...");
  for (const c of INITIAL_CAMPAIGNS) {
    await prisma.feeCampaign.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    })
  }

  console.log("Seeding fees...");
  for (const f of INITIAL_FEES) {
    await prisma.feeRecord.upsert({
      where: { id: f.id },
      update: {},
      create: f,
    })
  }

  console.log("Seeding audits...");
  for (const a of INITIAL_AUDIT) {
    await prisma.auditLog.upsert({
      where: { id: a.id },
      update: {},
      create: a,
    })
  }

  console.log("Seeding accounts...");
  for (const acc of INITIAL_ACCOUNTS) {
    await prisma.account.upsert({
      where: { id: acc.id },
      update: {},
      create: acc,
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log("Seeding completed successfully.")
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
