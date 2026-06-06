import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardDataFn } from "@/lib/api/audit.functions";
import { addEventFn, approveEventFn, registerEventFn, markAttendedFn } from "@/lib/api/events.functions";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, MapPin, Clock, CheckCircle2, UserPlus, QrCode, ScanLine, Copy, ExternalLink, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import type { EventItem } from "@/lib/types";

export const Route = createFileRoute("/app/events")({ component: EventsPage });

function EventsPage() {
  const { user } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startAt: "", location: "", enableQr: false, bonusPoints: 5 });
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [qrEvent, setQrEvent] = useState<EventItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardDataFn(),
  });

  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
  const addEventMut = useMutation({ mutationFn: (d: any) => addEventFn({ data: d }), onSuccess: invalidate });
  const approveMut = useMutation({ mutationFn: (d: any) => approveEventFn({ data: d }), onSuccess: invalidate });
  const registerMut = useMutation({ mutationFn: (d: any) => registerEventFn({ data: d }), onSuccess: invalidate });
  const attendMut = useMutation({ mutationFn: (d: any) => markAttendedFn({ data: d }), onSuccess: invalidate });

  const canCreate = can(user?.role, "events.create");
  const canApprove = can(user?.role, "events.approve");

  const list = useMemo(() => {
    if (!data) return [];
    let l = data.events;
    if (user?.role === "faculty_officer") {
      l = l.filter((e) => !e.facultyId || e.facultyId === user.facultyId);
    } else if (user?.role === "class_secretary" || user?.role === "member") {
      l = l.filter((e) => !e.facultyId || e.facultyId === user.facultyId);
    }
    
    if (statusFilter !== "all") l = l.filter((e) => e.status === statusFilter);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((e) => e.title.toLowerCase().includes(s));
    }
    return l.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [data, user, q, statusFilter]);

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;

  const checkinUrl = (eventId: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/app/checkin/${eventId}`;
    }
    return `/app/checkin/${eventId}`;
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
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Tạo hoạt động mới</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Tiêu đề</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Thời gian</Label><Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} /></div>
                  <div><Label>Địa điểm</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                </div>
                
                <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="enableQr" checked={form.enableQr} onCheckedChange={(c) => setForm({ ...form, enableQr: !!c })} />
                    <Label htmlFor="enableQr" className="font-medium">Sử dụng QR Code cho đoàn viên tự điểm danh</Label>
                  </div>
                  <div className="pl-6 flex items-center gap-3">
                    <Label>Cộng điểm rèn luyện:</Label>
                    <Input type="number" min={0} max={100} value={form.bonusPoints} onChange={(e) => setForm({ ...form, bonusPoints: parseInt(e.target.value) || 0 })} className="w-20 h-8" />
                  </div>
                  <p className="pl-6 text-xs text-muted-foreground">
                    {!form.enableQr ? "Không tạo QR. Cán bộ Đoàn sẽ điểm danh thủ công (nhập mã SV)." : "Sinh viên quét QR để tự điểm danh hoặc cán bộ dùng camera quét mã của SV."}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  if (!form.title.trim() || !form.startAt || !form.location.trim()) return toast.error("Vui lòng nhập đủ thông tin");
                  addEventMut.mutate({
                    title: form.title.trim(), description: form.description.trim(),
                    startAt: form.startAt, location: form.location.trim(),
                    status: user?.role === "class_secretary" ? "pending" : "approved",
                    createdBy: user?.code, facultyId: user?.facultyId,
                    enableQr: form.enableQr, bonusPoints: form.bonusPoints,
                  });
                  toast.success("Đã gửi yêu cầu tạo hoạt động");
                  setForm({ title: "", description: "", startAt: "", location: "", enableQr: false, bonusPoints: 5 });
                  setOpen(false);
                }}>Lưu</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-3">
        <Input placeholder="Tìm tên hoạt động..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((e: EventItem) => {
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
                  <p className="flex items-center gap-2 text-primary font-medium mt-1"><CheckCircle2 className="size-3.5" /> +{e.bonusPoints ?? 5} điểm RL</p>
                </div>
                <div className="flex gap-2 flex-wrap pt-2">
                  {canApprove && e.status === "pending" && (
                    <Button size="sm" onClick={() => { approveMut.mutate({ id: e.id, actor: user!.code }); toast.success("Đã duyệt hoạt động"); }}>
                      <CheckCircle2 className="size-4 mr-1" /> Duyệt
                    </Button>
                  )}
                  {canCreate && e.status === "approved" && (
                    e.enableQr ? (
                      <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => setQrEvent(e)}>
                        <QrCode className="size-4 mr-1" /> QR Check-in
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/app/checkin/$eventId" params={{ eventId: e.id }}>
                          <Keyboard className="size-4 mr-1" /> Quản lý điểm danh
                        </Link>
                      </Button>
                    )
                  )}
                  {user?.memberId && e.status === "approved" && !isRegistered && (
                    <Button size="sm" variant="outline" onClick={() => { registerMut.mutate({ eventId: e.id, memberId: user.memberId }); toast.success("Đã đăng ký"); }}>
                      <UserPlus className="size-4 mr-1" /> Đăng ký
                    </Button>
                  )}
                  {user?.memberId && isRegistered && !isAttended && (
                    <Button size="sm" variant="secondary" onClick={() => { attendMut.mutate({ eventId: e.id, memberId: user.memberId }); toast.success("Đã điểm danh"); }}>
                      {e.enableQr ? <QrCode className="size-4 mr-1" /> : <ScanLine className="size-4 mr-1" />} Điểm danh
                    </Button>
                  )}
                  {isAttended && <Badge>Đã có mặt</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── QR Code Dialog ─── */}
      <Dialog open={!!qrEvent} onOpenChange={(v) => { if (!v) setQrEvent(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5 text-primary" /> QR Check-in
            </DialogTitle>
            <DialogDescription>
              Chia sẻ mã QR này hoặc đường link để điểm danh sự kiện.
            </DialogDescription>
          </DialogHeader>
          {qrEvent && (
            <div className="space-y-4">
              {/* Event info */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="font-medium">{qrEvent.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> {qrEvent.startAt.replace("T", " ")}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> {qrEvent.location}</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-6 bg-white rounded-lg border">
                <QRCodeSVG
                  value={checkinUrl(qrEvent.id)}
                  size={220}
                  level="M"
                  includeMargin
                />
              </div>

              {/* Check-in link */}
              <div className="flex items-center gap-2">
                <Input value={checkinUrl(qrEvent.id)} readOnly className="text-xs font-mono" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(checkinUrl(qrEvent.id));
                    toast.success("Đã sao chép link");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(checkinUrl(qrEvent.id), "_blank")}
                >
                  <ExternalLink className="size-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                📱 Mở trang quét QR trên điện thoại, hoặc cán bộ Đoàn mở link để nhập mã sinh viên thủ công.
                <br />Tự động cộng <strong>+5 điểm rèn luyện</strong> khi check-in thành công.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQrEvent(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}