import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Building2, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/organization")({ component: Org });

function Org() {
  const { user, faculties, classes, members, addFaculty, renameFaculty, deleteFaculty, addClass, renameClass, deleteClass } = useStore();
  const allowed = can(user?.role, "org.manage");
  const [openFac, setOpenFac] = useState(false);
  const [openCls, setOpenCls] = useState(false);
  const [facName, setFacName] = useState(""); const [facCode, setFacCode] = useState("");
  const [clsName, setClsName] = useState(""); const [clsFaculty, setClsFaculty] = useState("");

  if (!allowed) return <NoAccess />;

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
              <DialogHeader><DialogTitle>Thêm Liên chi đoàn (Khoa)</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Mã khoa</Label><Input value={facCode} onChange={(e) => setFacCode(e.target.value)} placeholder="VD: CNTT" /></div>
                <div><Label>Tên khoa</Label><Input value={facName} onChange={(e) => setFacName(e.target.value)} placeholder="VD: Khoa Công nghệ Thông tin" /></div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  if (!facName.trim() || !facCode.trim()) { toast.error("Vui lòng nhập đủ thông tin"); return; }
                  addFaculty(facName.trim(), facCode.trim().toUpperCase());
                  setFacName(""); setFacCode(""); setOpenFac(false); toast.success("Đã thêm khoa");
                }}>Lưu</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={openCls} onOpenChange={setOpenCls}>
            <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Thêm lớp</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Thêm Chi đoàn lớp</DialogTitle></DialogHeader>
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
                <Button onClick={() => {
                  if (!clsName.trim() || !clsFaculty) { toast.error("Vui lòng nhập đủ thông tin"); return; }
                  addClass(clsName.trim(), clsFaculty);
                  setClsName(""); setClsFaculty(""); setOpenCls(false); toast.success("Đã thêm lớp");
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
                    <Button size="icon" variant="ghost" onClick={() => {
                      const n = prompt("Tên khoa mới", f.name); if (n && n.trim()) renameFaculty(f.id, n.trim());
                    }}><Pencil className="size-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => {
                      if (confirm(`Xóa khoa "${f.name}"?`)) deleteFaculty(f.id);
                    }}><Trash2 className="size-4 text-destructive" /></Button>
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
                      <Button size="icon" variant="ghost" className="size-7 opacity-0 group-hover:opacity-100" onClick={() => {
                        const n = prompt("Tên lớp mới", c.name); if (n && n.trim()) renameClass(c.id, n.trim());
                      }}><Pencil className="size-3" /></Button>
                      <Button size="icon" variant="ghost" className="size-7 opacity-0 group-hover:opacity-100" onClick={() => {
                        if (confirm(`Xóa lớp "${c.name}"?`)) deleteClass(c.id);
                      }}><Trash2 className="size-3 text-destructive" /></Button>
                    </li>
                  ))}
                  {cls.length === 0 && <li className="text-xs text-muted-foreground italic p-2">Chưa có lớp nào</li>}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
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