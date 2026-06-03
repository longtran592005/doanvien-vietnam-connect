import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore, DEMO_USERS } from "@/lib/store";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { can } from "@/lib/permissions";
import {
  LayoutDashboard, Users, Network, Award, CalendarDays, Wallet,
  FileBarChart, ShieldAlert, Settings, Bell, LogOut, KeyRound, ChevronDown,
  Menu, GraduationCap, CheckCircle2, AlertTriangle, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({ component: AppLayout });

interface NavItem { to: string; label: string; icon: any; perm?: string; }
const NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/app/organization", label: "Tổ chức Đoàn", icon: Network, perm: "org.manage" },
  { to: "/app/members", label: "Đoàn viên", icon: Users },
  { to: "/app/training", label: "Rèn luyện & Kỷ luật", icon: Award },
  { to: "/app/events", label: "Hoạt động", icon: CalendarDays },
  { to: "/app/fees", label: "Đoàn phí", icon: Wallet, perm: "fees.view" },
  { to: "/app/reports", label: "Báo cáo & Xuất dữ liệu", icon: FileBarChart, perm: "reports.view" },
  { to: "/app/audit", label: "Kiểm tra & Nhật ký", icon: ShieldAlert, perm: "audit.view" },
  { to: "/app/settings", label: "Cấu hình hệ thống", icon: Settings, perm: "system.admin" },
];

function AppLayout() {
  const { user, logout, switchRole } = useStore();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [pwdOpen, setPwdOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) nav({ to: "/login" });
  }, [user, nav]);

  if (!user) return null;

  const visibleNav = NAV.filter((n) => !n.perm || can(user.role, n.perm));

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "w-64 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-col",
        "fixed inset-y-0 left-0 z-40 transition-transform md:static md:flex",
        sidebarOpen ? "flex translate-x-0" : "hidden md:flex -translate-x-full md:translate-x-0",
      )}>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">TBU</div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">QL Đoàn viên</p>
            <p className="text-xs text-muted-foreground">Đại học Thái Bình</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNav.map((n) => {
            const active = path === n.to || path.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Đoàn TNCS HCM — TBU</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card/60 backdrop-blur sticky top-0 z-30 flex items-center px-4 md:px-6 gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen((v) => !v)}>
            <Menu className="size-5" />
          </Button>
          <div className="hidden md:flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary/10 text-primary grid place-items-center">
              <GraduationCap className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Trường Đại học Thái Bình</p>
              <p className="text-xs text-muted-foreground">Đoàn TNCS Hồ Chí Minh</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Role switcher (demo) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Badge variant="secondary" className="font-normal">DEMO</Badge>
                  <span className="hidden sm:inline">{ROLE_LABELS[user.role]}</span>
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Chuyển vai trò (kiểm thử)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={user.role} onValueChange={(v) => switchRole(v as Role)}>
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                    <DropdownMenuRadioItem key={r} value={r}>{ROLE_LABELS[r]}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <NotificationsBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2 pr-3">
                  <div className="size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                    {user.name.split(" ").slice(-1)[0].slice(0, 1)}
                  </div>
                  <div className="hidden md:block text-left leading-tight">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.code}</p>
                  </div>
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPwdOpen(true)}>
                  <KeyRound className="size-4 mr-2" /> Đổi mật khẩu
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); nav({ to: "/login" }); }}>
                  <LogOut className="size-4 mr-2" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />
    </div>
  );
}

function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  // see below
  return <ChangePasswordDialogImpl open={open} onOpenChange={onOpenChange} />;
}

interface Notif { id: string; title: string; desc?: string; kind: "info" | "warn" | "success"; at?: string; }

function useNotifications(): Notif[] {
  const { user, events, members, fees, training, audit, classes } = useStore();
  if (!user) return [];
  const list: Notif[] = [];
  const now = Date.now();
  const inScope = (facultyId?: string) => {
    if (["admin", "university_officer", "inspection_officer", "financial_officer"].includes(user.role)) return true;
    if (user.role === "faculty_officer") return !facultyId || facultyId === user.facultyId;
    if (user.role === "class_secretary") return !facultyId || facultyId === user.facultyId;
    return true;
  };
  if (["admin", "university_officer", "faculty_officer"].includes(user.role)) {
    events.filter((e) => e.status === "pending" && inScope(e.facultyId)).forEach((e) =>
      list.push({ id: `ev-${e.id}`, kind: "warn", title: "Hoạt động chờ phê duyệt", desc: e.title, at: e.startAt }),
    );
  }
  events.filter((e) => e.status === "approved").forEach((e) => {
    const t = new Date(e.startAt).getTime();
    if (t - now > 0 && t - now < 14 * 86400000 && inScope(e.facultyId)) {
      list.push({ id: `up-${e.id}`, kind: "info", title: "Sắp diễn ra: " + e.title, desc: e.location, at: e.startAt });
    }
  });
  if (user.role === "member" || user.role === "class_secretary") {
    const mid = user.memberId;
    if (mid) {
      events.filter((e) => e.registered.includes(mid) && !e.attended.includes(mid) && e.status === "approved").forEach((e) =>
        list.push({ id: `me-${e.id}`, kind: "info", title: "Bạn đã đăng ký: " + e.title, at: e.startAt }),
      );
      fees.filter((f) => f.memberId === mid && !f.paid).forEach((f) =>
        list.push({ id: `fee-${f.id}`, kind: "warn", title: "Chưa đóng đoàn phí", desc: `Kỳ ${f.period} — ${f.amount.toLocaleString("vi-VN")}đ` }),
      );
      const me = members.find((m) => m.id === mid);
      if (me && me.trainingScore < 50) {
        list.push({ id: `sc-${mid}`, kind: "warn", title: "Điểm rèn luyện thấp", desc: `Hiện tại: ${me.trainingScore}` });
      }
      training.filter((t) => t.memberId === mid).slice(0, 3).forEach((t) =>
        list.push({
          id: `tr-${t.id}`,
          kind: t.type === "reward" ? "success" : "warn",
          title: t.type === "reward" ? `Cộng ${t.delta} điểm rèn luyện` : `Trừ ${Math.abs(t.delta)} điểm rèn luyện`,
          desc: t.reason,
          at: t.date,
        }),
      );
    }
  }
  if (user.role === "financial_officer" || user.role === "admin") {
    const unpaid = fees.filter((f) => !f.paid).length;
    if (unpaid > 0) list.push({ id: "fin-unpaid", kind: "warn", title: "Đoàn phí chưa thu", desc: `${unpaid} khoản chưa hoàn tất` });
  }
  if (user.role === "class_secretary" && user.classId) {
    const low = members.filter((m) => m.classId === user.classId && m.trainingScore < 50);
    if (low.length) list.push({ id: "cs-low", kind: "warn", title: "Đoàn viên cần lưu ý", desc: `${low.length} bạn có điểm rèn luyện < 50` });
  }
  if (user.role === "faculty_officer" && user.facultyId) {
    const cls = classes.filter((c) => c.facultyId === user.facultyId).length;
    list.push({ id: "fo-info", kind: "info", title: "Phạm vi quản lý", desc: `${cls} chi đoàn thuộc khoa` });
  }
  if (user.role === "inspection_officer" || user.role === "admin") {
    audit.slice(0, 3).forEach((a) =>
      list.push({ id: `au-${a.id}`, kind: "info", title: a.action, desc: a.target, at: a.at }),
    );
  }
  return list.slice(0, 20);
}

function NotificationsBell() {
  const items = useNotifications();
  const count = items.length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {count > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Thông báo</span>
          <Badge variant="secondary" className="font-normal">{count}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground text-center">Không có thông báo mới</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => {
              const Icon = n.kind === "success" ? CheckCircle2 : n.kind === "warn" ? AlertTriangle : Info;
              const color = n.kind === "success" ? "text-emerald-500" : n.kind === "warn" ? "text-amber-500" : "text-primary";
              return (
                <div key={n.id} className="px-3 py-2.5 flex gap-3 hover:bg-accent/50 border-b last:border-0">
                  <Icon className={cn("size-4 mt-0.5 shrink-0", color)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    {n.desc && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.desc}</p>}
                    {n.at && <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.at).toLocaleString("vi-VN")}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChangePasswordDialogImpl({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { changePassword } = useStore();
  const [oldP, setOldP] = useState("");
  const [newP, setNewP] = useState("");
  const [conf, setConf] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newP !== conf) { setErr("Mật khẩu xác nhận không khớp."); return; }
    const r = changePassword(oldP, newP);
    if (r) { setErr(r); return; }
    toast.success("Đổi mật khẩu thành công");
    setOldP(""); setNewP(""); setConf(""); setErr(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>Mật khẩu mới phải có ít nhất 6 ký tự.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Mật khẩu hiện tại</Label>
            <Input type="password" value={oldP} onChange={(e) => setOldP(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mật khẩu mới</Label>
            <Input type="password" value={newP} onChange={(e) => setNewP(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Xác nhận mật khẩu mới</Label>
            <Input type="password" value={conf} onChange={(e) => setConf(e.target.value)} />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit">Cập nhật</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}