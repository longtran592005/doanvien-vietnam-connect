import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardDataFn } from "@/lib/api/audit.functions";
import { addFacultyFn, renameFacultyFn, deleteFacultyFn, addClassFn, renameClassFn, deleteClassFn } from "@/lib/api/organization.functions";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Building2, Users, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { ClassUnit, Faculty } from "@/lib/types";

export const Route = createFileRoute("/app/organization")({ component: Org });

function Org() {
  const { user } = useStore();
  const allowed = can(user?.role, "org.manage");
  
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardDataFn(),
  });

  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });

  const addFacMut = useMutation({ mutationFn: (d: any) => addFacultyFn({ data: d }), onSuccess: invalidate });
  const renFacMut = useMutation({ mutationFn: (d: any) => renameFacultyFn({ data: d }), onSuccess: invalidate });
  const delFacMut = useMutation({ mutationFn: (d: any) => deleteFacultyFn({ data: d }), onSuccess: invalidate });
  const addClsMut = useMutation({ mutationFn: (d: any) => addClassFn({ data: d }), onSuccess: invalidate });
  const renClsMut = useMutation({ mutationFn: (d: any) => renameClassFn({ data: d }), onSuccess: invalidate });
  const delClsMut = useMutation({ mutationFn: (d: any) => deleteClassFn({ data: d }), onSuccess: invalidate });
  const [openFac, setOpenFac] = useState(false);
  const [openCls, setOpenCls] = useState(false);
  const [facName, setFacName] = useState(""); const [facCode, setFacCode] = useState("");
  const [clsName, setClsName] = useState(""); const [clsFaculty, setClsFaculty] = useState("");
  const [editFac, setEditFac] = useState<Faculty | null>(null);
  const [editCls, setEditCls] = useState<ClassUnit | null>(null);
  const [delFac, setDelFac] = useState<Faculty | null>(null);
  const [delCls, setDelCls] = useState<ClassUnit | null>(null);

  if (!allowed) return <NoAccess />;
  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;
  const { faculties, classes, members } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tổ chức Đoàn</h1>
          <p className="text-sm text-muted-foreground">Đoàn trường → Liên chi đoàn (Khoa) → Chi đoàn lớp</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openFac} onOpenChange={setOpenFac}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="size-4 mr-1" /> Thêm khoa</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm Liên chi đoàn (Khoa)</DialogTitle>
                <DialogDescription>Mỗi khoa tương đương một Liên chi đoàn trực thuộc Đoàn trường.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>Mã khoa</Label><Input value={facCode} onChange={(e) => setFacCode(e.target.value)} placeholder="VD: CNTT" /></div>
                <div><Label>Tên khoa</Label><Input value={facName} onChange={(e) => setFacName(e.target.value)} placeholder="VD: Khoa Công nghệ Thông tin" /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenFac(false)}>Hủy</Button>
                <Button onClick={() => {
                  if (!facName.trim() || !facCode.trim()) { toast.error("Vui lòng nhập đủ thông tin"); return; }
                  addFacMut.mutate({ name: facName.trim(), code: facCode.trim().toUpperCase() }, {
                    onSuccess: (res) => { if (res.error) toast.error(res.error); else { setFacName(""); setFacCode(""); setOpenFac(false); toast.success("Đã thêm khoa"); } }
                  });
                }}>Lưu</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={openCls} onOpenChange={setOpenCls}>
            <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Thêm lớp</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm Chi đoàn lớp</DialogTitle>
                <DialogDescription>Chi đoàn lớp trực thuộc Liên chi đoàn (Khoa).</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>Khoa</Label>
                  <Select value={clsFaculty} onValueChange={setClsFaculty}>
                    <SelectTrigger><SelectValue placeholder="Chọn khoa" /></SelectTrigger>
                    <SelectContent>{faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Tên lớp</Label><Input value={clsName} onChange={(e) => setClsName(e.target.value)} placeholder="VD: CNTT K65A" /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenCls(false)}>Hủy</Button>
                <Button onClick={() => {
                  if (!clsName.trim() || !clsFaculty) { toast.error("Vui lòng nhập đủ thông tin"); return; }
                  addClsMut.mutate({ name: clsName.trim(), facultyId: clsFaculty }, {
                    onSuccess: (res) => { if (res.error) toast.error(res.error); else { setClsName(""); setClsFaculty(""); setOpenCls(false); toast.success("Đã thêm lớp"); } }
                  });
                }}>Lưu</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {faculties.map((f) => {
          const cls = classes.filter((c) => c.facultyId === f.id);
          const count = members.filter((m) => m.facultyId === f.id).length;
          return (
            <Card key={f.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center"><Building2 className="size-5" /></div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{f.name}</CardTitle>
                      <CardDescription>{f.code} · {cls.length} lớp · {count} đoàn viên</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditFac(f)}><Pencil className="size-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDelFac(f)}><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {cls.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted text-sm group">
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                      <Users className="size-3.5 text-muted-foreground" />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{members.filter((m) => m.classId === c.id).length}</span>
                      <Button size="icon" variant="ghost" className="size-7 opacity-0 group-hover:opacity-100" onClick={() => setEditCls(c)}><Pencil className="size-3" /></Button>
                      <Button size="icon" variant="ghost" className="size-7 opacity-0 group-hover:opacity-100" onClick={() => setDelCls(c)}><Trash2 className="size-3 text-destructive" /></Button>
                    </li>
                  ))}
                  {cls.length === 0 && <li className="text-xs text-muted-foreground italic p-2">Chưa có lớp nào</li>}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EditFacultyDialog
        faculty={editFac}
        onClose={() => setEditFac(null)}
        onSave={(name) => { renFacMut.mutate({ id: editFac!.id, name }); toast.success("Đã cập nhật khoa"); setEditFac(null); }}
      />
      <EditClassDialog
        cls={editCls}
        onClose={() => setEditCls(null)}
        onSave={(name) => { renClsMut.mutate({ id: editCls!.id, name }); toast.success("Đã cập nhật lớp"); setEditCls(null); }}
      />

      <AlertDialog open={!!delFac} onOpenChange={(o) => !o && setDelFac(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" /> Xác nhận xóa khoa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa khoa <span className="font-medium text-foreground">"{delFac?.name}"</span>?
              Thao tác này không thể hoàn tác. Các lớp và đoàn viên thuộc khoa sẽ không còn được liên kết.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (delFac) { delFacMut.mutate({ id: delFac.id }, { onSuccess: (res) => { if (res.error) toast.error(res.error); else { toast.success("Đã xóa khoa"); setDelFac(null); } } }); } }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!delCls} onOpenChange={(o) => !o && setDelCls(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" /> Xác nhận xóa lớp
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa lớp <span className="font-medium text-foreground">"{delCls?.name}"</span>?
              Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (delCls) { delClsMut.mutate({ id: delCls.id }, { onSuccess: (res) => { if (res.error) toast.error(res.error); else { toast.success("Đã xóa lớp"); setDelCls(null); } } }); } }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditFacultyDialog({ faculty, onClose, onSave }: { faculty: Faculty | null; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <Dialog open={!!faculty} onOpenChange={(o) => { if (!o) onClose(); else { setName(faculty?.name ?? ""); setErr(null); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa khoa</DialogTitle>
          <DialogDescription>Cập nhật tên hiển thị của khoa (Liên chi đoàn).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Mã khoa</Label>
            <Input value={faculty?.code ?? ""} disabled className="bg-muted" />
          </div>
          <div>
            <Label>Tên khoa</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setErr(null); }} autoFocus />
            {err && <p className="text-xs text-destructive mt-1">{err}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={() => {
            if (!name.trim()) { setErr("Tên khoa không được để trống"); return; }
            onSave(name.trim());
          }}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditClassDialog({ cls, onClose, onSave }: { cls: ClassUnit | null; onClose: () => void; onSave: (name: string) => void }) {
  const { data } = useQuery({ queryKey: ["dashboard-data"], queryFn: () => getDashboardDataFn() });
  const faculties = data?.faculties ?? [];
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const fac = faculties.find((f) => f.id === cls?.facultyId);
  return (
    <Dialog open={!!cls} onOpenChange={(o) => { if (!o) onClose(); else { setName(cls?.name ?? ""); setErr(null); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Chi đoàn lớp</DialogTitle>
          <DialogDescription>Cập nhật tên hiển thị của Chi đoàn lớp.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Khoa</Label>
            <Input value={fac?.name ?? ""} disabled className="bg-muted" />
          </div>
          <div>
            <Label>Tên lớp</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setErr(null); }} autoFocus />
            {err && <p className="text-xs text-destructive mt-1">{err}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={() => {
            if (!name.trim()) { setErr("Tên lớp không được để trống"); return; }
            onSave(name.trim());
          }}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NoAccess() {
  return (
    <Card><CardContent className="p-10 text-center text-muted-foreground">
      Bạn không có quyền truy cập chức năng này.
    </CardContent></Card>
  );
}

export { NoAccess };