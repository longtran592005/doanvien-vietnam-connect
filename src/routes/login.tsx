import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, DEFAULT_PWD } from "@/lib/store";
import { loginFn } from "@/lib/api/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ShieldCheck, Eye, EyeOff, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

const REMEMBER_KEY = "tbu_remember_code";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { setUser } = useStore();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(REMEMBER_KEY);
      if (v) { setCode(v); setRemember(true); }
    } catch {}
  }, []);

  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !password.trim()) {
      setErr("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setLoading(true);
    setErr(null);
    
    const attemptLogin = async (retryCount: number) => {
      try {
        const result = await loginFn({ data: { code: code.trim(), password } });
        if (result.error) {
          setErr(result.error);
          return;
        }
        if (result.user) {
          setUser(result.user);
        }
        try {
          if (remember) localStorage.setItem(REMEMBER_KEY, code.trim());
          else localStorage.removeItem(REMEMBER_KEY);
        } catch {}
        toast.success("Đăng nhập thành công");
        nav({ to: "/app/dashboard" });
      } catch (e: any) {
        if (retryCount > 0) {
          console.warn("Lỗi kết nối lần đầu, đang thử lại...", e);
          // Wait briefly before retrying
          await new Promise((resolve) => setTimeout(resolve, 800));
          await attemptLogin(retryCount - 1);
        } else {
          console.error(e);
          setErr("Đã xảy ra lỗi kết nối. Vui lòng thử lại.");
        }
      }
    };

    await attemptLogin(1);
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-secondary via-background to-accent/40 flex items-center justify-center p-4 overflow-hidden">
      {/* Decorative background watermark */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute -top-20 -left-20 w-[520px] opacity-[0.05] text-primary" viewBox="0 0 200 200" fill="currentColor">
          <path d="M0,100 C40,60 80,140 120,100 C160,60 200,140 240,100 L240,200 L0,200 Z" />
        </svg>
        <svg className="absolute -bottom-24 -right-16 w-[640px] opacity-[0.05] text-primary" viewBox="0 0 200 200" fill="currentColor">
          <path d="M0,120 C50,80 100,160 150,120 C200,80 250,160 300,120 L300,220 L0,220 Z" />
        </svg>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }} />
      </div>

      <div className="relative w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <img src="/logo/tbu-logo.svg" alt="TBU Logo" className="size-16 object-contain" />
              <img src="/logo/logo-doan.png" alt="Đoàn TNCS HCM Logo" className="size-16 object-contain" />
            </div>
            <div className="h-12 w-px bg-border/60 mx-1" />
            <div>
              <p className="text-sm font-medium text-foreground/70">Trường Đại học Thái Bình</p>
              <h1 className="text-2xl font-semibold tracking-tight leading-tight">Hệ thống Quản lý Đoàn viên</h1>
            </div>
          </div>
          <p className="text-foreground/70 leading-relaxed">
            Nền tảng quản lý đoàn viên, hoạt động và đoàn phí của Đoàn TNCS Hồ Chí Minh — Trường Đại học Thái Bình.
            Hỗ trợ đầy đủ quy trình từ cấp Chi đoàn lớp đến Đoàn trường.
          </p>
          <DemoAccountsBlock />
        </div>

        <Card className="border-border/60 shadow-lg shadow-primary/5">
          <CardHeader className="space-y-3">
            <div className="md:hidden flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <img src="/logo/tbu-logo.svg" alt="TBU Logo" className="size-10 object-contain" />
                <img src="/logo/logo-doan.png" alt="Đoàn TNCS HCM Logo" className="size-10 object-contain" />
              </div>
              <div className="h-8 w-px bg-border/60 mx-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground/70">Đại học Thái Bình</p>
                <p className="text-sm font-semibold leading-tight">Quản lý Đoàn viên</p>
              </div>
            </div>
            <div>
              <CardTitle>Đăng nhập</CardTitle>
              <CardDescription className="text-foreground/65">
                Sử dụng Mã sinh viên hoặc Mã giảng viên
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã đăng nhập</Label>
                <Input
                  id="code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="SV20210001 hoặc CB001"
                  autoComplete="username"
                  className="h-11 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="pw"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-11 pr-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPwd}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                    id="remember"
                  />
                  <span className="text-foreground/80">Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {err && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  {err}
                </p>
              )}
              <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
              <p className="text-xs text-foreground/60 text-center">
                Bằng việc đăng nhập, bạn đồng ý với quy định sử dụng hệ thống của Đoàn trường.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      <ForgotPasswordDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}


const DEMO_ACCOUNTS: { code: string; role: string }[] = [
  { code: "ADMIN01", role: "Quản trị viên" },
  { code: "CB001", role: "Cán bộ Đoàn trường" },
  { code: "CB101", role: "Liên chi đoàn" },
  { code: "SV20210001", role: "Bí thư Chi đoàn" },
  { code: "SV20210002", role: "Đoàn viên" },
  { code: "CB201", role: "Kiểm tra / Thống kê" },
  { code: "CB301", role: "Tài chính" },
];

function DemoAccountsBlock() {
  return (
    <div className="rounded-xl border bg-card p-4 text-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" /> Tài khoản demo
        </p>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground border rounded-full px-2 py-0.5">
          Chỉ môi trường thử nghiệm
        </span>
      </div>
      <p className="text-foreground/70">
        Mật khẩu mặc định: <code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">{DEFAULT_PWD}</code>
      </p>
      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-[1fr_1.2fr] bg-muted/60 text-xs font-medium text-foreground/70 px-3 py-2">
          <span>Mã tài khoản</span>
          <span>Vai trò</span>
        </div>
        <ul className="divide-y">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.code} className="grid grid-cols-[1fr_1.2fr] px-3 py-1.5 text-xs items-center hover:bg-accent/40">
              <code className="font-mono text-foreground">{a.code}</code>
              <span className="text-foreground/75">{a.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ForgotPasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quên mật khẩu</DialogTitle>
          <DialogDescription>
            Vui lòng liên hệ Quản trị viên hệ thống để được đặt lại mật khẩu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <User className="size-4 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Văn phòng Đoàn trường — TBU</p>
              <p className="text-muted-foreground">Phòng A1.01 — Trường Đại học Thái Bình</p>
            </div>
          </div>
          <a
            href="tel:02273831273"
            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/40 transition"
          >
            <Phone className="size-4 text-primary" />
            <span><span className="font-medium">Điện thoại:</span> (0227) 383 1273</span>
          </a>
          <a
            href="mailto:doantruong@tbu.edu.vn"
            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/40 transition"
          >
            <Mail className="size-4 text-primary" />
            <span><span className="font-medium">Email:</span> doantruong@tbu.edu.vn</span>
          </a>
          <p className="text-xs text-muted-foreground">
            Khi yêu cầu, vui lòng cung cấp Mã đăng nhập và họ tên đầy đủ để Quản trị viên xác minh.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đã hiểu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}