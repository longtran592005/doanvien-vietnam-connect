import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardDataFn } from "@/lib/api/audit.functions";
import { addMemberFn } from "@/lib/api/members.functions";
import { scopedMembers } from "@/lib/scope";
import { classify, CLASSIFICATION_LABELS, PARTY_LABELS } from "@/lib/types";
import type { PartyStatus } from "@/lib/types";
import { can } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/members")({ component: MembersPage });

function MembersPage() {
  const { user } = useStore();
  
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardDataFn(),
  });

  const [q, setQ] = useState("");
  const [facFilter, setFacFilter] = useState("all");
  const [clsFilter, setClsFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const allowedAdd = can(user?.role, "members.edit");

  const list = useMemo(() => {
    if (!data) return [];
    let l = scopedMembers(data.members, user!);
    if (facFilter !== "all") l = l.filter((m) => m.facultyId === facFilter);
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
        {allowedAdd && (
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4 mr-1.5" /> Thêm đoàn viên
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc mã..." className="pl-9" />
            </div>
            <Select value={facFilter} onValueChange={(v) => { setFacFilter(v); setClsFilter("all"); }}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoa</SelectItem>
                {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={clsFilter} onValueChange={setClsFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                {classes.filter((c) => facFilter === "all" || c.facultyId === facFilter).map((c) => (
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
    </div>
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