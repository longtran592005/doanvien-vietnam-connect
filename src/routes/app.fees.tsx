import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { can } from "@/lib/permissions";
import { NoAccess } from "./app.organization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Wallet, Check, X } from "lucide-react";

export const Route = createFileRoute("/app/fees")({ component: FeesPage });

function FeesPage() {
  const { user, members, fees, faculties, classes, toggleFee } = useStore();
  if (!can(user?.role, "fees.view")) return <NoAccess />;
  const canManage = can(user?.role, "fees.manage");

  const [q, setQ] = useState("");
  const [facFilter, setFacFilter] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    return fees.map((f) => {
      const m = members.find((x) => x.id === f.memberId)!;
      return { fee: f, member: m };
    }).filter(({ member, fee }) => {
      if (!member) return false;
      if (facFilter !== "all" && member.facultyId !== facFilter) return false;
      if (status === "paid" && !fee.paid) return false;
      if (status === "unpaid" && fee.paid) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        if (!member.fullName.toLowerCase().includes(s) && !member.code.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [fees, members, q, facFilter, status]);

  const totalPaid = rows.filter((r) => r.fee.paid).reduce((s, r) => s + r.fee.amount, 0);
  const totalDue = rows.filter((r) => !r.fee.paid).reduce((s, r) => s + r.fee.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quản lý Đoàn phí</h1>
        <p className="text-sm text-muted-foreground">Theo dõi đoàn phí đã thu / còn nợ theo Khoa và Lớp.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Đã thu" value={totalPaid.toLocaleString("vi") + " ₫"} tone="primary" />
        <KpiCard label="Còn nợ" value={totalDue.toLocaleString("vi") + " ₫"} tone="destructive" />
        <KpiCard label="Số khoản" value={rows.length} tone="muted" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đoàn phí</CardTitle>
          <CardDescription>Kỳ 2026-Q1 · Mức {(30000).toLocaleString("vi")} ₫ / kỳ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm đoàn viên..." className="pl-9" />
            </div>
            <Select value={facFilter} onValueChange={setFacFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoa</SelectItem>
                {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="paid">Đã nộp</SelectItem>
                <SelectItem value="unpaid">Chưa nộp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground"><tr className="text-left">
                  <th className="px-3 py-2 font-medium">Mã SV</th>
                  <th className="px-3 py-2 font-medium">Họ tên</th>
                  <th className="px-3 py-2 font-medium">Lớp</th>
                  <th className="px-3 py-2 font-medium">Kỳ</th>
                  <th className="px-3 py-2 font-medium text-right">Số tiền</th>
                  <th className="px-3 py-2 font-medium">Trạng thái</th>
                  <th className="px-3 py-2"></th>
                </tr></thead>
                <tbody>
                  {rows.slice(0, 200).map(({ fee, member }) => (
                    <tr key={fee.id} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs">{member.code}</td>
                      <td className="px-3 py-2">{member.fullName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{classes.find((c) => c.id === member.classId)?.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{fee.period}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fee.amount.toLocaleString("vi")} ₫</td>
                      <td className="px-3 py-2">
                        <Badge variant={fee.paid ? "default" : "destructive"}>{fee.paid ? "Đã nộp" : "Chưa nộp"}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canManage && (
                          <Button size="sm" variant={fee.paid ? "ghost" : "outline"} onClick={() => toggleFee(fee.id)}>
                            {fee.paid ? <><X className="size-3.5 mr-1" /> Hủy</> : <><Check className="size-3.5 mr-1" /> Đánh dấu nộp</>}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: any; tone: "primary" | "destructive" | "muted" }) {
  const cls = tone === "primary" ? "bg-primary/10 text-primary" : tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground";
  return (
    <Card><CardContent className="p-5 flex items-center gap-4">
      <div className={"size-12 rounded-xl grid place-items-center " + cls}><Wallet className="size-5" /></div>
      <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-semibold">{value}</p></div>
    </CardContent></Card>
  );
}