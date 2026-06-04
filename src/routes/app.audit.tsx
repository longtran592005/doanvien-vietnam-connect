import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogsFn } from "@/lib/api/audit.functions";
import { can } from "@/lib/permissions";
import { NoAccess } from "./app.organization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/audit")({ component: AuditPage });

function AuditPage() {
  const { user } = useStore();
  if (!can(user?.role, "audit.view")) return <NoAccess />;

  const { data: audit, isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: () => getAuditLogsFn(),
  });

  if (isLoading || !audit) return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kiểm tra & Nhật ký hệ thống</h1>
        <p className="text-sm text-muted-foreground">Toàn bộ thao tác được ghi nhận để phục vụ kiểm tra, thống kê.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Nhật ký hoạt động</CardTitle><CardDescription>{audit.length} bản ghi</CardDescription></CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground"><tr className="text-left">
                <th className="px-3 py-2 font-medium">Thời gian</th>
                <th className="px-3 py-2 font-medium">Người thực hiện</th>
                <th className="px-3 py-2 font-medium">Hành động</th>
                <th className="px-3 py-2 font-medium">Đối tượng</th>
              </tr></thead>
              <tbody>
                {audit.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">{new Date(a.at).toLocaleString("vi")}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.actor}</td>
                    <td className="px-3 py-2"><Badge variant="outline">{a.action}</Badge></td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{a.target ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}