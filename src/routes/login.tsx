import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, DEFAULT_PWD } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { login } = useStore();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !password.trim()) {
      setErr("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    const error = login(code.trim(), password);
    if (error) {
      setErr(error);
      return;
    }
    toast.success("Đăng nhập thành công");
    nav({ to: "/app/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent/40 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center font-bold text-xl">TBU</div>
            <div>
              <p className="text-sm text-muted-foreground">Trường Đại học Thái Bình</p>
              <h1 className="text-2xl font-semibold tracking-tight">Hệ thống Quản lý Đoàn viên</h1>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Nền tảng quản lý đoàn viên, hoạt động và đoàn phí của Đoàn TNCS Hồ Chí Minh — Trường Đại học Thái Bình.
            Hỗ trợ đầy đủ quy trình từ cấp Chi đoàn lớp đến Đoàn trường.
          </p>
          <div className="rounded-xl border bg-card p-4 text-sm space-y-2">
            <p className="font-medium flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Tài khoản demo</p>
            <p className="text-muted-foreground">Mật khẩu mặc định: <code className="font-mono text-foreground">{DEFAULT_PWD}</code></p>
            <ul className="text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <li><code>ADMIN01</code> — Quản trị</li>
              <li><code>CB001</code> — Đoàn trường</li>
              <li><code>CB101</code> — Liên chi đoàn</li>
              <li><code>SV20210001</code> — Bí thư</li>
              <li><code>SV20210002</code> — Đoàn viên</li>
              <li><code>CB201</code> — Kiểm tra</li>
              <li><code>CB301</code> — Tài chính</li>
            </ul>
          </div>
        </div>

        <Card className="border-border/60 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>Đăng nhập</CardTitle>
            <CardDescription>Sử dụng Mã sinh viên hoặc Mã giảng viên</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã đăng nhập</Label>
                <Input id="code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="SV20210001 hoặc CB001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">Mật khẩu</Label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button type="submit" className="w-full">Đăng nhập</Button>
              <p className="text-xs text-muted-foreground text-center">
                Quên mật khẩu? Liên hệ Quản trị viên để được đặt lại.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}