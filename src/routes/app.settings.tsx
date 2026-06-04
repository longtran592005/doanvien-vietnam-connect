import { createFileRoute } from "@tanstack/react-router";
import { useStore, DEMO_USERS, DEFAULT_PWD } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { getBackupDataFn } from "@/lib/api/audit.functions";
import { can } from "@/lib/permissions";
import { NoAccess } from "./app.organization";
import { ROLE_LABELS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, KeyRound, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user } = useStore();
  if (!can(user?.role, "system.admin")) return <NoAccess />;

  const { data, isLoading } = useQuery({
    queryKey: ["backup-data"],
    queryFn: () => getBackupDataFn(),
  });

  const backup = async () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tbu-doan-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tải bản sao lưu");
  };

  const membersCount = data?.members.length ?? 0;
  const eventsCount = data?.events.length ?? 0;
  const auditCount = data?.audit.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cấu hình hệ thống</h1>
        <p className="text-sm text-muted-foreground">Quản trị tài khoản, mật khẩu và sao lưu dữ liệu.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /> Tài khoản demo</CardTitle>
            <CardDescription>Đặt lại mật khẩu về giá trị mặc định: <code className="font-mono">{DEFAULT_PWD}</code></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground"><tr className="text-left">
                  <th className="px-3 py-2 font-medium">Mã</th>
                  <th className="px-3 py-2 font-medium">Họ tên</th>
                  <th className="px-3 py-2 font-medium">Vai trò</th>
                  <th className="px-3 py-2"></th>
                </tr></thead>
                <tbody>
                  {Object.values(DEMO_USERS).map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{u.code}</td>
                      <td className="px-3 py-2">{u.name}</td>
                      <td className="px-3 py-2"><Badge variant="outline">{ROLE_LABELS[u.role]}</Badge></td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => { toast.success("Đã đặt lại mật khẩu (Mock)"); }}>
                          Đặt lại
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="size-5 text-primary" /> Sao lưu dữ liệu</CardTitle>
            <CardDescription>Tải bản sao lưu toàn bộ dữ liệu ra file JSON</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Stat label="Đoàn viên" value={membersCount} />
              <Stat label="Hoạt động" value={eventsCount} />
              <Stat label="Nhật ký" value={auditCount} />
            </div>
            <Button onClick={backup} disabled={isLoading}><Download className="size-4 mr-1" /> Tạo bản sao lưu</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="p-3 rounded-lg border bg-muted/30">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-semibold">{value.toLocaleString("vi")}</p>
  </div>;
}