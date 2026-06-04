import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { getDashboardDataFn } from "@/lib/api/audit.functions";
import { can } from "@/lib/permissions";
import { NoAccess } from "./app.organization";
import { classify, CLASSIFICATION_LABELS, PARTY_LABELS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reports")({ component: ReportsPage });

function ReportsPage() {
  const { user } = useStore();
  if (!can(user?.role, "reports.view")) return <NoAccess />;

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardDataFn(),
  });

  const [facFilter, setFacFilter] = useState("all");
  const [clsFilter, setClsFilter] = useState("all");

  const list = useMemo(() => {
    if (!data) return [];
    return data.members.filter((m) =>
      (facFilter === "all" || m.facultyId === facFilter) &&
      (clsFilter === "all" || m.classId === clsFilter),
    );
  }, [data, facFilter, clsFilter]);

  const exportCSV = () => {
    const headers = ["Mã SV", "Họ tên", "Lớp", "Khoa", "Điện thoại", "Email", "Điểm RL", "Xếp loại", "Trạng thái Đảng", "Đoàn phí"];
    const rows = list.map((m) => [
      m.code, m.fullName,
      classes.find((c) => c.id === m.classId)?.name ?? "",
      faculties.find((f) => f.id === m.facultyId)?.name ?? "",
      m.phone, m.email, m.trainingScore,
      CLASSIFICATION_LABELS[classify(m.trainingScore)],
      PARTY_LABELS[m.partyStatus],
      m.feePaid ? "Đã nộp" : "Chưa nộp",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bao-cao-doan-vien-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Đã xuất " + list.length + " bản ghi");
  };

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;
  const { faculties, classes, members } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Báo cáo & Xuất dữ liệu</h1>
        <p className="text-sm text-muted-foreground">Lọc và xuất danh sách đoàn viên ra Excel/CSV.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="size-5 text-primary" /> Xuất danh sách đoàn viên</CardTitle>
          <CardDescription>Bộ lọc áp dụng cho file xuất</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={facFilter} onValueChange={(v) => { setFacFilter(v); setClsFilter("all"); }}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoa</SelectItem>
                {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={clsFilter} onValueChange={setClsFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                {classes.filter((c) => facFilter === "all" || c.facultyId === facFilter).map((c) =>
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={exportCSV} className="ml-auto"><Download className="size-4 mr-1" /> Xuất CSV / Excel</Button>
          </div>
          <p className="text-sm text-muted-foreground">Sẵn sàng xuất <strong>{list.length}</strong> bản ghi.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tổng hợp theo Khoa</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground"><tr className="text-left">
                <th className="px-3 py-2 font-medium">Khoa</th>
                <th className="px-3 py-2 font-medium text-right">Tổng ĐV</th>
                <th className="px-3 py-2 font-medium text-right">Xuất sắc</th>
                <th className="px-3 py-2 font-medium text-right">Khá</th>
                <th className="px-3 py-2 font-medium text-right">Trung bình</th>
                <th className="px-3 py-2 font-medium text-right">Yếu</th>
                <th className="px-3 py-2 font-medium text-right">Cảm tình Đảng</th>
              </tr></thead>
              <tbody>
                {faculties.map((f) => {
                  const ms = members.filter((m) => m.facultyId === f.id);
                  const cnt = (c: string) => ms.filter((m) => classify(m.trainingScore) === c).length;
                  return (
                    <tr key={f.id} className="border-t">
                      <td className="px-3 py-2">{f.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{ms.length}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{cnt("excellent")}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{cnt("good")}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{cnt("average")}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{cnt("poor")}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{ms.filter((m) => m.partyStatus !== "member").length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}