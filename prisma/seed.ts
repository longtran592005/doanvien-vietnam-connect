import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FACULTIES = [
  { id: "f_cnkt", code: "CNKT", name: "Khoa Công nghệ và Kỹ thuật" },
  { id: "f_ktl", code: "KTLQHQT", name: "Khoa Kinh tế, Luật và Quan hệ quốc tế" },
];

const MAJORS_CNKT = [
  { code: "CNTT", name: "Công nghệ thông tin" },
  { code: "CTM", name: "Chế tạo máy" },
  { code: "CĐT", name: "Cơ điện tử" },
  { code: "CK", name: "Cơ khí" },
  { code: "ĐL", name: "Điện lạnh" },
  { code: "OT", name: "Ô tô" },
  { code: "ĐCN", name: "Điện công nghiệp" },
  { code: "ĐTCN", name: "Điện tử công nghiệp" },
];

const MAJORS_KTL = [
  { code: "KTDN", name: "Kế toán doanh nghiệp" },
  { code: "KTTH", name: "Kế toán tổng hợp" },
  { code: "QLKT", name: "Quản lý kinh tế" },
  { code: "TCNH", name: "Tài chính ngân hàng" },
  { code: "LUAT", name: "Luật" },
  { code: "LGT&QTCCU", name: "Logistics và quản trị chuỗi cung ứng" },
  { code: "QTDLKS", name: "Quản trị du lịch - khách sạn" },
  { code: "MKTTM", name: "Marketing thương mại" },
  { code: "QLDN", name: "Quản lý doanh nghiệp" },
  { code: "QTKDTH", name: "Quản trị kinh doanh tổng hợp" },
  { code: "QTNNL", name: "Quản trị nguồn nhân lực" },
];

const COHORTS = [
  { num: 11, year: 2022 },
  { num: 12, year: 2023 },
  { num: 13, year: 2024 },
  { num: 14, year: 2025 },
];

const CLASSES: Array<{ id: string; facultyId: string; name: string; joinYear: number }> = [];
let cIdx = 1;

for (const cohort of COHORTS) {
  for (const major of MAJORS_CNKT) {
    CLASSES.push({
      id: `c_${cohort.num}_${major.code}`,
      facultyId: "f_cnkt",
      name: `DH${cohort.num}-${major.code}`,
      joinYear: cohort.year
    });
  }
  for (const major of MAJORS_KTL) {
    CLASSES.push({
      id: `c_${cohort.num}_${major.code.replace('&', '')}`,
      facultyId: "f_ktl",
      name: `DH${cohort.num}-${major.code}`,
      joinYear: cohort.year
    });
  }
}

const FIRST = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
const MID = ["Văn", "Thị", "Minh", "Quang", "Thanh", "Hữu", "Xuân", "Thu", "Hải", "Ngọc", "Tuấn", "Hồng", "Đức", "Trọng", "Thành"];
const LAST = ["An", "Bình", "Chi", "Dung", "Hà", "Hải", "Khánh", "Linh", "Mai", "Nam", "Phong", "Quân", "Sơn", "Trang", "Tuấn", "Vy", "Anh", "Long", "Hiếu", "Thảo", "Hương", "Đạt", "Hùng", "Huy", "Lan", "Nhung"];
const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: T[]) => a[rand(a.length)];

function genMembers() {
  const out = [];
  let i = 1;
  for (const c of CLASSES) {
    const count = 10 + rand(8); // 10-17 students per class
    for (let k = 1; k <= count; k++) {
      const score = 50 + rand(50); // 50 to 99
      const joinMonth = String(8 + rand(3)).padStart(2, '0'); // Aug to Oct
      const joinDay = String(1 + rand(28)).padStart(2, '0');
      // Student code format: SV + Year + ClassCodeNum + Sequence
      // e.g. SV 2022 001 001
      const studentCode = `SV${c.joinYear}${String(cIdx).padStart(3, "0")}${String(k).padStart(3, "0")}`;
      
      out.push({
        id: `m_${c.id}_${k}`,
        code: studentCode,
        fullName: `${pick(FIRST)} ${pick(MID)} ${pick(LAST)}`,
        dob: `${c.joinYear - 18}-0${1 + rand(9)}-1${rand(9)}`, // Assuming roughly 18 at join year
        gender: rand(2) === 0 ? "M" : "F",
        classId: c.id,
        facultyId: c.facultyId,
        phone: `09${rand(10)}${rand(10)}${rand(10)}${rand(10)}${rand(10)}${rand(10)}${rand(10)}${rand(10)}`,
        email: `${studentCode.toLowerCase()}@tbu.edu.vn`,
        joinDate: `${c.joinYear}-${joinMonth}-${joinDay}`,
        partyStatus: score > 85 ? (rand(4) === 0 ? "aspirant" : "member") : "member",
        trainingScore: score,
        feePaid: rand(4) !== 0,
        role: "member",
      });
      i++;
    }
    cIdx++;
  }
  return out;
}

const INITIAL_MEMBERS = genMembers();

const INITIAL_EVENTS = [
  {
    id: "e1",
    title: "Lễ kết nạp Đoàn viên mới 2026",
    description: "Lễ kết nạp đoàn viên mới toàn trường.",
    startAt: "2026-06-15T08:00",
    location: "Hội trường A — TBU",
    status: "approved",
    createdBy: "university",
    registeredIds: INITIAL_MEMBERS.slice(0, 50).map((m) => m.id),
  },
  {
    id: "e2",
    title: "Ngày hội Việc làm TBU 2026",
    description: "Kết nối sinh viên với các doanh nghiệp, tập đoàn.",
    startAt: "2026-07-10T07:30",
    location: "Khuôn viên TBU",
    status: "approved",
    createdBy: "university",
    registeredIds: INITIAL_MEMBERS.slice(50, 150).map((m) => m.id),
  },
  {
    id: "e3",
    title: "Hội thảo Công nghệ tương lai",
    description: "Hội thảo học thuật cấp Khoa Công nghệ và Kỹ thuật.",
    startAt: "2026-08-01T13:30",
    location: "Phòng Hội thảo C1",
    status: "pending",
    createdBy: "faculty",
    facultyId: "f_cnkt",
    registeredIds: INITIAL_MEMBERS.filter(m => m.facultyId === 'f_cnkt').slice(0, 40).map((m) => m.id),
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
  id: `fee_${m.id}`,
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
  { id: "u-fac1", code: "CB_CNKT", name: "Trần Trưởng Khoa", role: "faculty_officer", password: "TBU@2026", facultyId: "f_cnkt", createdAt: new Date().toISOString() },
  { id: "u-fac2", code: "CB_KTL", name: "Lê Trưởng Khoa", role: "faculty_officer", password: "TBU@2026", facultyId: "f_ktl", createdAt: new Date().toISOString() },
  { id: "u-sec", code: INITIAL_MEMBERS[0].code, name: INITIAL_MEMBERS[0].fullName, role: "class_secretary", password: "TBU@2026", classId: INITIAL_MEMBERS[0].classId, facultyId: INITIAL_MEMBERS[0].facultyId, memberId: INITIAL_MEMBERS[0].id, createdAt: new Date().toISOString() },
  { id: "u-mem", code: INITIAL_MEMBERS[1].code, name: INITIAL_MEMBERS[1].fullName, role: "member", password: "TBU@2026", classId: INITIAL_MEMBERS[1].classId, facultyId: INITIAL_MEMBERS[1].facultyId, memberId: INITIAL_MEMBERS[1].id, createdAt: new Date().toISOString() },
  { id: "u-insp", code: "CB201", name: "Phạm Thanh Kiểm", role: "inspection_officer", password: "TBU@2026", createdAt: new Date().toISOString() },
  { id: "u-fin", code: "CB301", name: "Hoàng Quỹ Đoàn", role: "financial_officer", password: "TBU@2026", createdAt: new Date().toISOString() },
];

async function main() {
  console.log("Seeding faculties...");
  for (const f of FACULTIES) {
    await prisma.faculty.upsert({
      where: { id: f.id },
      update: f,
      create: f,
    })
  }

  console.log("Seeding classes...");
  for (const c of CLASSES) {
    const { joinYear, ...classData } = c;
    await prisma.classUnit.upsert({
      where: { id: classData.id },
      update: classData,
      create: classData,
    })
  }

  console.log("Seeding members...");
  // Bulk insert for members due to potentially large number
  await prisma.member.deleteMany({});
  
  // Chunking to avoid sqlite too many variables error
  const chunkSize = 100;
  for (let i = 0; i < INITIAL_MEMBERS.length; i += chunkSize) {
    const chunk = INITIAL_MEMBERS.slice(i, i + chunkSize);
    await prisma.member.createMany({
      data: chunk,
    });
  }

  console.log("Seeding events...");
  await prisma.eventItem.deleteMany({});
  for (const e of INITIAL_EVENTS) {
    const { registeredIds, ...eventData } = e;
    await prisma.eventItem.create({
      data: {
        ...eventData,
        registeredMembers: {
          connect: registeredIds.map(id => ({ id }))
        }
      },
    })
  }

  console.log("Seeding fee campaigns...");
  await prisma.feeCampaign.deleteMany({});
  for (const c of INITIAL_CAMPAIGNS) {
    await prisma.feeCampaign.create({
      data: c,
    })
  }

  console.log("Seeding fees...");
  await prisma.feeRecord.deleteMany({});
  for (let i = 0; i < INITIAL_FEES.length; i += chunkSize) {
    const chunk = INITIAL_FEES.slice(i, i + chunkSize);
    await prisma.feeRecord.createMany({
      data: chunk,
    });
  }

  console.log("Seeding audits...");
  for (const a of INITIAL_AUDIT) {
    await prisma.auditLog.upsert({
      where: { id: a.id },
      update: a,
      create: a,
    })
  }

  console.log("Seeding accounts...");
  await prisma.account.deleteMany({});
  for (const acc of INITIAL_ACCOUNTS) {
    await prisma.account.create({
      data: acc,
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
