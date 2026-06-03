import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore, DEMO_USERS } from "@/lib/store";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { can } from "@/lib/permissions";
import {
  LayoutDashboard, Users, Network, Award, CalendarDays, Wallet,
  FileBarChart, ShieldAlert, Settings, Bell, LogOut, KeyRound, ChevronDown,
  Menu, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
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

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-primary" />
            </Button>

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