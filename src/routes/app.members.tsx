import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardDataFn } from "@/lib/api/audit.functions";
import { addMemberFn } from "@/lib/api/members.functions";
import { importMembersFromExcelFn, exportMembersToExcelFn } from "@/lib/api/import.functions";
import { scopedMembers } from "@/lib/scope";
import { classify, CLASSIFICATION_LABELS, PARTY_LABELS } from "@/lib/types";
import type { PartyStatus } from "@/lib/types";
import { can } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, UserPlus, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/members")({ component: MembersPage });

/* ───────────────────────────── helpers ───────────────────────────── */
function downloadBase64(base64: string, filename: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function MembersPage() {
  const { user } = useStore();
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardDataFn(),
  });

  const [q, setQ] = useState("");
  const [facFilter, setFacFilter] = useState("all");
  const [clsFilter, setClsFilter] = useState("all");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const allowedAdd = can(user?.role, "members.edit");

  /* ── Export Excel ── */
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportMembersToExcelFn();
      downloadBase64(res.base64, `doan-vien-${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success(`Đã xuất ${res.count} đoàn viên ra file Excel`);
    } catch (e: any) {
      toast.error("Lỗi xuất Excel: " + (e.message || "Không rõ"));
    } finally {
      setExporting(false);
    }
  };

  const cohorts = useMemo(() => {
    if (!data) return [];
    const cs = new Set<string>();
    data.classes.forEach(c => {
      const match = c.name.match(/DH(\d+)-/);
      if (match) cs.add(match[1]);
    });
    return Array.from(cs).sort((a, b) => b.localeCompare(a));
  }, [data]);

  const list = useMemo(() => {
    if (!data) return [];
    let l = scopedMembers(data.members, user!);
    if (facFilter !== "all") l = l.filter((m) => m.facultyId === facFilter);
    if (cohortFilter !== "all") {
      l = l.filter((m) => {
        const c = data.classes.find(cls => cls.id === m.classId);
        return c && c.name.includes(`DH${cohortFilter}-`);
      });
    }
    if (clsFilter !== "all") l = l.filter((m) => m.classId === clsFilter);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((m) => m.fullName.toLowerCase().includes(s) || m.code.toLowerCase().includes(s));
    }
    return l;
  }, [data, user, q, facFilter, clsFilter]);

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;
  const { faculties, classes } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Đoàn viên</h1>
          <p className="text-sm text-muted-foreground">Danh sách hồ sơ Đoàn viên (Mẫu 2C)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {allowedAdd && (
            <>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="size-4 mr-1.5" /> Import Excel
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={exporting}>
                {exporting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Download className="size-4 mr-1.5" />}
                Export Excel
              </Button>
              <Button onClick={() => setAddOpen(true)}>
                <UserPlus className="size-4 mr-1.5" /> Thêm đoàn viên
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc mã..." className="pl-9" />
            </div>
            <Select value={cohortFilter} onValueChange={(v) => { setCohortFilter(v); setClsFilter("all"); }}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Khóa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Khóa</SelectItem>
                {cohorts.map((c) => <SelectItem key={c} value={c}>Khóa {c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={facFilter} onValueChange={(v) => { setFacFilter(v); setClsFilter("all"); }}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Khoa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoa</SelectItem>
                {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={clsFilter} onValueChange={setClsFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Lớp" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                {classes.filter((c) => 
                  (facFilter === "all" || c.facultyId === facFilter) &&
                  (cohortFilter === "all" || c.name.includes(`DH${cohortFilter}-`))
                ).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-3 py-2.5 font-medium">Mã SV</th>
                    <th className="px-3 py-2.5 font-medium">Họ tên</th>
                    <th className="px-3 py-2.5 font-medium">Lớp</th>
                    <th className="px-3 py-2.5 font-medium">Khoa</th>
                    <th className="px-3 py-2.5 font-medium text-right">Điểm RL</th>
                    <th className="px-3 py-2.5 font-medium">Xếp loại</th>
                    <th className="px-3 py-2.5 font-medium">Đảng</th>
                    <th className="px-3 py-2.5 font-medium">Đoàn phí</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => {
                    const cls = classify(m.trainingScore);
                    return (
                      <tr key={m.id} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono text-xs">{m.code}</td>
                        <td className="px-3 py-2 font-medium">{m.fullName}</td>
                        <td className="px-3 py-2 text-muted-foreground">{classes.find((c) => c.id === m.classId)?.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{faculties.find((f) => f.id === m.facultyId)?.code}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{m.trainingScore}</td>
                        <td className="px-3 py-2">
                          <Badge variant={cls === "excellent" ? "default" : cls === "good" ? "secondary" : cls === "poor" ? "destructive" : "outline"}>
                            {CLASSIFICATION_LABELS[cls]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs">{PARTY_LABELS[m.partyStatus]}</td>
                        <td className="px-3 py-2">
                          <Badge variant={m.feePaid ? "secondary" : "destructive"} className="font-normal">
                            {m.feePaid ? "Đã nộp" : "Chưa nộp"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link to="/app/members/$id" params={{ id: m.id }}><Eye className="size-4" /></Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {list.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">Không có đoàn viên nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Hiển thị {list.length.toLocaleString("vi")} bản ghi</p>
        </CardContent>
      </Card>

      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} />
      <ImportExcelDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

/* ─────────── Import Excel Dialog ─────────── */
function ImportExcelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useStore();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ imported?: number; skipped?: number; errors?: string[]; error?: string } | null>(null);

  const importMut = useMutation({
    mutationFn: async (base64: string) => importMembersFromExcelFn({ data: { base64, actor: user?.code } }),
    onSuccess: (res: any) => {
      if (res.error) {
        setResult({ error: res.error });
        toast.error(res.error);
        return;
      }
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success(`Import thành công: ${res.imported} đoàn viên`);
    },
    onError: (e: any) => {
      setResult({ error: e.message || "Lỗi không rõ" });
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); }
  };

  const handleImport = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const buf = ev.target?.result as ArrayBuffer;
      const base64 = btoa(
        new Uint8Array(buf).reduce((d, b) => d + String.fromCharCode(b), ""),
      );
      importMut.mutate(base64);
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (open) { setFile(null); setResult(null); }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" /> Import Excel
          </DialogTitle>
          <DialogDescription>
            Tải lên file <code>.xlsx</code> theo mẫu. Hệ thống sẽ tự động thêm/cập nhật đoàn viên.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template note */}
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-medium text-primary">Cột file Excel mẫu:</p>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              Mã SV | Họ tên | Ngày sinh | Giới tính | Khoa (mã) | Lớp | SĐT | Email | Ngày vào Đoàn | Trạng thái Đảng | Điểm RL | Đoàn phí
            </p>
            <p className="text-xs text-muted-foreground">
              💡 Mẹo: Xuất file Excel hiện tại rồi dùng làm mẫu để import.
            </p>
          </div>

          {/* File input */}
          <div
            className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {file ? file.name : "Nhấn để chọn file .xlsx"}
            </p>
            {file && <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>

          {/* Result */}
          {result && !result.error && (
            <div className="space-y-2">
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="size-4" /> {result.imported} thành công</span>
                {(result.skipped ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="size-4" /> {result.skipped} bỏ qua</span>
                )}
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded border bg-muted/50 p-2 space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          {result?.error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="size-4" /> {result.error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button onClick={handleImport} disabled={!file || importMut.isPending}>
            {importMut.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Upload className="size-4 mr-1.5" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useStore();
  
  const { data } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardDataFn(),
  });
  const faculties = data?.faculties ?? [];
  const classes = data?.classes ?? [];
  const members = data?.members ?? [];
  
  const queryClient = useQueryClient();
  const addMutation = useMutation({
    mutationFn: (m: any) => addMemberFn({ data: m }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Đã thêm đoàn viên mới");
      onOpenChange(false);
    }
  });

  const isFac = user?.role === "faculty_officer";
  const isCls = user?.role === "class_secretary";

  const initialFac = isFac || isCls ? user?.facultyId ?? "" : "";
  const initialCls = isCls ? user?.classId ?? "" : "";

  const [form, setForm] = useState({
    code: "",
    fullName: "",
    dob: "",
    gender: "M" as "M" | "F",
    facultyId: initialFac,
    classId: initialCls,
    phone: "",
    email: "",
    joinDate: new Date().toISOString().slice(0, 10),
    partyStatus: "member" as PartyStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({
        code: "",
        fullName: "",
        dob: "",
        gender: "M",
        facultyId: initialFac,
        classId: initialCls,
        phone: "",
        email: "",
        joinDate: new Date().toISOString().slice(0, 10),
        partyStatus: "member",
      });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: "" }));
  };

  const availableClasses = classes.filter((c) => !form.facultyId || c.facultyId === form.facultyId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = "Vui lòng nhập mã đoàn viên";
    else if (members.some((m) => m.code.toLowerCase() === form.code.trim().toLowerCase())) e.code = "Mã đã tồn tại";
    if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ tên";
    if (!form.dob) e.dob = "Vui lòng chọn ngày sinh";
    if (!form.facultyId) e.facultyId = "Vui lòng chọn khoa";
    if (!form.classId) e.classId = "Vui lòng chọn lớp";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email không hợp lệ";
    if (form.phone && !/^0\d{9,10}$/.test(form.phone)) e.phone = "Số điện thoại không hợp lệ";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    addMutation.mutate({
      code: form.code.trim(),
      fullName: form.fullName.trim(),
      dob: form.dob,
      gender: form.gender,
      classId: form.classId,
      facultyId: form.facultyId,
      phone: form.phone.trim(),
      email: form.email.trim(),
      joinDate: form.joinDate,
      partyStatus: form.partyStatus,
      trainingScore: 70,
      feePaid: false,
      role: "member",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm đoàn viên mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin cơ bản theo Mẫu 2C. Các trường có dấu (*) là bắt buộc.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Mã đoàn viên *" error={errors.code}>
              <Input value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="VD: SV20250001" autoFocus />
            </Field>
            <Field label="Họ và tên *" error={errors.fullName}>
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Nguyễn Văn A" />
            </Field>
            <Field label="Ngày sinh *" error={errors.dob}>
              <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
            </Field>
            <Field label="Giới tính">
              <Select value={form.gender} onValueChange={(v) => set("gender", v as "M" | "F")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Nam</SelectItem>
                  <SelectItem value="F">Nữ</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Khoa *" error={errors.facultyId}>
              <Select
                value={form.facultyId}
                onValueChange={(v) => { set("facultyId", v); set("classId", ""); }}
                disabled={isFac || isCls}
              >
                <SelectTrigger><SelectValue placeholder="Chọn khoa" /></SelectTrigger>
                <SelectContent>{faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Lớp / Chi đoàn *" error={errors.classId}>
              <Select value={form.classId} onValueChange={(v) => set("classId", v)} disabled={isCls || !form.facultyId}>
                <SelectTrigger><SelectValue placeholder={form.facultyId ? "Chọn lớp" : "Chọn khoa trước"} /></SelectTrigger>
                <SelectContent>
                  {availableClasses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Số điện thoại" error={errors.phone}>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="09xxxxxxxx" inputMode="tel" />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="ten@tbu.edu.vn" />
            </Field>
            <Field label="Ngày vào Đoàn">
              <Input type="date" value={form.joinDate} onChange={(e) => set("joinDate", e.target.value)} />
            </Field>
            <Field label="Trạng thái Đảng">
              <Select value={form.partyStatus} onValueChange={(v) => set("partyStatus", v as PartyStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PARTY_LABELS) as PartyStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>{PARTY_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Điểm rèn luyện khởi tạo mặc định là 70. Có thể chỉnh sửa thêm tại hồ sơ chi tiết sau khi tạo.
          </p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">
              <UserPlus className="size-4 mr-1.5" /> Thêm đoàn viên
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}