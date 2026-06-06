import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma, logAudit } from "../db.server";
import * as XLSX from "xlsx";

// ─── Columns in the template ────────────────────────────────────────
// Mã SV | Họ tên | Ngày sinh | Giới tính | Khoa (mã) | Lớp | SĐT | Email | Ngày vào Đoàn | Trạng thái Đảng | Điểm RL | Đoàn phí

const COL_MAP: Record<string, string> = {
  "Mã SV": "code",
  "Họ tên": "fullName",
  "Ngày sinh": "dob",
  "Giới tính": "gender",
  "Khoa (mã)": "facultyCode",
  "Lớp": "className",
  "SĐT": "phone",
  "Email": "email",
  "Ngày vào Đoàn": "joinDate",
  "Trạng thái Đảng": "partyStatus",
  "Điểm RL": "trainingScore",
  "Đoàn phí": "feePaid",
};

const PARTY_REVERSE: Record<string, string> = {
  "Đoàn viên": "member",
  "Cảm tình Đảng": "aspirant",
  "Đảng viên": "party_member",
};

/**
 * Import members from an XLSX buffer sent as a Base64 string.
 * Returns { success, imported, skipped, errors }.
 */
export const importMembersFromExcelFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ base64: z.string(), actor: z.string().optional() }))
  .handler(async ({ data }) => {
    try {
      const buffer = Buffer.from(data.base64, "base64");
      const wb = XLSX.read(buffer, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) return { error: "File không chứa dữ liệu." };

      const raw: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);
      if (raw.length === 0) return { error: "Sheet trống." };

      // Map header names -> internal keys
      const rows = raw.map((r) => {
        const out: Record<string, any> = {};
        for (const [header, key] of Object.entries(COL_MAP)) {
          if (r[header] !== undefined) out[key] = r[header];
        }
        return out;
      });

      // Lookup faculties & classes
      const faculties = await prisma.faculty.findMany();
      const classes = await prisma.classUnit.findMany();

      const facByCode = new Map(faculties.map((f) => [f.code, f]));
      const clsByName = new Map(classes.map((c) => [c.name, c]));

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const [i, row] of rows.entries()) {
        const rowNum = i + 2; // header = 1
        if (!row.code || !row.fullName) {
          errors.push(`Dòng ${rowNum}: Thiếu Mã SV hoặc Họ tên.`);
          skipped++;
          continue;
        }

        const fac = facByCode.get(String(row.facultyCode || ""));
        const cls = clsByName.get(String(row.className || ""));

        if (!fac) {
          errors.push(`Dòng ${rowNum}: Không tìm thấy khoa "${row.facultyCode}".`);
          skipped++;
          continue;
        }
        if (!cls) {
          errors.push(`Dòng ${rowNum}: Không tìm thấy lớp "${row.className}".`);
          skipped++;
          continue;
        }

        // Normalise fields
        const gender = String(row.gender || "").trim();
        const genderVal = gender === "Nữ" || gender === "F" ? "F" : "M";

        const partyRaw = String(row.partyStatus || "Đoàn viên").trim();
        const partyStatus = PARTY_REVERSE[partyRaw] || "member";

        const score = Number(row.trainingScore) || 70;
        const feePaid =
          String(row.feePaid || "").trim() === "Đã nộp" || row.feePaid === true;

        try {
          await prisma.member.upsert({
            where: { code: String(row.code).trim() },
            update: {
              fullName: String(row.fullName).trim(),
              dob: String(row.dob || ""),
              gender: genderVal,
              phone: String(row.phone || ""),
              email: String(row.email || ""),
              joinDate: String(row.joinDate || ""),
              partyStatus,
              trainingScore: Math.max(0, Math.min(100, score)),
              feePaid,
              classId: cls.id,
              facultyId: fac.id,
            },
            create: {
              code: String(row.code).trim(),
              fullName: String(row.fullName).trim(),
              dob: String(row.dob || ""),
              gender: genderVal,
              phone: String(row.phone || ""),
              email: String(row.email || ""),
              joinDate: String(row.joinDate || ""),
              partyStatus,
              trainingScore: Math.max(0, Math.min(100, score)),
              feePaid,
              role: "member",
              classId: cls.id,
              facultyId: fac.id,
            },
          });
          imported++;
        } catch (e: any) {
          errors.push(`Dòng ${rowNum} (${row.code}): ${e.message?.slice(0, 80)}`);
          skipped++;
        }
      }

      await logAudit(
        `Import Excel: ${imported} thành công, ${skipped} bỏ qua`,
        data.actor || "system",
      );
      return { success: true, imported, skipped, errors: errors.slice(0, 20) };
    } catch (e: any) {
      return { error: `Lỗi đọc file Excel: ${e.message?.slice(0, 120)}` };
    }
  });

/**
 * Export all members to XLSX. Returns a Base64 string of the workbook.
 */
export const exportMembersToExcelFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const members = await prisma.member.findMany();
    const faculties = await prisma.faculty.findMany();
    const classes = await prisma.classUnit.findMany();

    const facMap = new Map(faculties.map((f) => [f.id, f]));
    const clsMap = new Map(classes.map((c) => [c.id, c]));

    const PARTY_LABELS: Record<string, string> = {
      member: "Đoàn viên",
      aspirant: "Cảm tình Đảng",
      party_member: "Đảng viên",
    };

    const rows = members.map((m) => ({
      "Mã SV": m.code,
      "Họ tên": m.fullName,
      "Ngày sinh": m.dob,
      "Giới tính": m.gender === "F" ? "Nữ" : "Nam",
      "Khoa (mã)": facMap.get(m.facultyId)?.code ?? "",
      "Khoa": facMap.get(m.facultyId)?.name ?? "",
      "Lớp": clsMap.get(m.classId)?.name ?? "",
      "SĐT": m.phone,
      "Email": m.email,
      "Ngày vào Đoàn": m.joinDate,
      "Trạng thái Đảng": PARTY_LABELS[m.partyStatus] ?? m.partyStatus,
      "Điểm RL": m.trainingScore,
      "Đoàn phí": m.feePaid ? "Đã nộp" : "Chưa nộp",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    // Set column widths
    ws["!cols"] = [
      { wch: 14 }, // Mã SV
      { wch: 24 }, // Họ tên
      { wch: 12 }, // Ngày sinh
      { wch: 8 },  // Giới tính
      { wch: 10 }, // Khoa (mã)
      { wch: 30 }, // Khoa
      { wch: 16 }, // Lớp
      { wch: 14 }, // SĐT
      { wch: 26 }, // Email
      { wch: 14 }, // Ngày vào Đoàn
      { wch: 16 }, // Trạng thái Đảng
      { wch: 10 }, // Điểm RL
      { wch: 10 }, // Đoàn phí
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Đoàn viên");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return { base64: Buffer.from(buf).toString("base64"), count: rows.length };
  },
);
