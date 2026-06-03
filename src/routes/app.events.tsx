import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, Check, UserPlus, QrCode } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/events")({ component: EventsPage });

function EventsPage() {
  const { user, events, addEvent, approveEvent, registerEvent, markAttended, members } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startAt: "", location: "" });

  const canCreate = can(user?.role, "events.create");
  const canApprove = can(user?.role, "events.approve");

  const submit = () => {
    if (!form.title.trim() || !form.startAt || !form.location.trim()) return toast.error("Vui lòng nhập đủ thông tin");
    addEvent({
      title: form.title.trim(), description: form.description.trim(),
      startAt: form.startAt, location: form.location.trim(),
      status: user!.role === "class_secretary" ? "pending" : "approved",
      createdBy: user!.code, facultyId: user!.facultyId,
    });
    toast.success("Đã tạo hoạt động");
    setForm({ title: "", description: "", startAt: "", location: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hoạt động Đoàn</h1>
          <p className="text-sm text-muted-foreground">Quản lý hoạt động, đăng ký và điểm danh.</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Tạo hoạt động</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Tạo hoạt động mới</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Tiêu đề</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Thời gian</Label><Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} /></div>
                  <div><Label>Địa điểm</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={submit}>Lưu</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((e) => {
          const isRegistered = user?.memberId ? e.registered.includes(user.memberId) : false;
          const isAttended = user?.memberId ? e.attended.includes(user.memberId) : false;
          return (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{e.title}</CardTitle>
                  <Badge variant={e.status === "approved" ? "default" : e.status === "pending" ? "secondary" : "outline"}>
                    {e.status === "approved" ? "Đã duyệt" : e.status === "pending" ? "Chờ duyệt" : e.status === "draft" ? "Nháp" : "Hoàn tất"}
                  </Badge>
                </div>
                <CardDescription>{e.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p className="flex items-center gap-2"><Clock className="size-3.5" /> {e.startAt.replace("T", " ")}</p>
                  <p className="flex items-center gap-2"><MapPin className="size-3.5" /> {e.location}</p>
                  <p className="flex items-center gap-2"><UserPlus className="size-3.5" /> {e.registered.length} đăng ký · {e.attended.length} có mặt</p>
                </div>
                <div className="flex gap-2 flex-wrap pt-2">
                  {canApprove && e.status === "pending" && (
                    <Button size="sm" onClick={() => { approveEvent(e.id); toast.success("Đã phê duyệt"); }}>
                      <Check className="size-4 mr-1" /> Phê duyệt
                    </Button>
                  )}
                  {user?.memberId && e.status === "approved" && !isRegistered && (
                    <Button size="sm" variant="outline" onClick={() => { registerEvent(e.id, user.memberId!); toast.success("Đã đăng ký"); }}>
                      <UserPlus className="size-4 mr-1" /> Đăng ký
                    </Button>
                  )}
                  {user?.memberId && isRegistered && !isAttended && (
                    <Button size="sm" variant="secondary" onClick={() => { markAttended(e.id, user.memberId!); toast.success("Đã điểm danh"); }}>
                      <QrCode className="size-4 mr-1" /> Điểm danh (mô phỏng QR)
                    </Button>
                  )}
                  {isAttended && <Badge>Đã có mặt</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}