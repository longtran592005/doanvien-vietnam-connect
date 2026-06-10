import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { getDashboardDataFn } from "@/lib/api/audit.functions";
import { exportMembersToExcelFn } from "@/lib/api/import.functions";
import { can } from "@/lib/permissions";
import { NoAccess } from "./app.organization";
import { classify } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Loader2, ArrowUpDown, FileSpreadsheet, FileText, Printer, Filter } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/app/reports")({ component: ReportsPage });

const PIE_COLORS = {
  excellent: "#22c55e", // green-500
  good: "#3b82f6",      // blue-500
  average: "#eab308",   // yellow-500
  poor: "#ef4444"       // red-500
};

function ReportsPage() {
  const { user } = useStore();
  if (!can(user?.role, "reports.view")) return <NoAccess />;

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardDataFn(),
  });

  const [facFilter, setFacFilter] = useState("all");
  const [clsFilter, setClsFilter] = useState("all");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [exportingExcel, setExportingExcel] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, dir: 'asc' | 'desc' } | null>(null);

  const cohorts = useMemo(() => {
    if (!data) return [];
    const cs = new Set<string>();
    data.classes.forEach(c => {
      const match = c.name.match(/DH(\d+)-/);
      if (match) cs.add(match[1]);
    });
    return Array.from(cs).sort((a, b) => b.localeCompare(a));
  }, [data]);

  // Filtered members for all metrics
  const filteredMembers = useMemo(() => {
    if (!data) return [];
    let l = data.members;
    if (facFilter !== "all") l = l.filter((m) => m.facultyId === facFilter);
    if (cohortFilter !== "all") {
      l = l.filter((m) => {
        const c = data.classes.find(cls => cls.id === m.classId);
        return c && c.name.includes(`DH${cohortFilter}-`);
      });
    }
    if (clsFilter !== "all") l = l.filter((m) => m.classId === clsFilter);
    return l;
  }, [data, facFilter, clsFilter, cohortFilter]);

  // Data for Charts
  const pieData = useMemo(() => {
    let e = 0, g = 0, a = 0, p = 0;
    filteredMembers.forEach(m => {
      const c = classify(m.trainingScore);
      if (c === 'excellent') e++;
      else if (c === 'good') g++;
      else if (c === 'average') a++;
      else p++;
    });
    return [
      { name: "Xuất sắc", value: e, color: PIE_COLORS.excellent },
      { name: "Khá", value: g, color: PIE_COLORS.good },
      { name: "Trung bình", value: a, color: PIE_COLORS.average },
      { name: "Yếu", value: p, color: PIE_COLORS.poor },
    ];
  }, [filteredMembers]);

  const barData = useMemo(() => {
    if (!data) return [];
    if (facFilter === "all") {
      return data.faculties.map(f => {
        const count = filteredMembers.filter(m => m.facultyId === f.id).length;
        return { name: f.code || f.name, fullName: f.name, count };
      }).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
    } else {
      return data.classes.filter(c => c.facultyId === facFilter).map(c => {
        const count = filteredMembers.filter(m => m.classId === c.id).length;
        return { name: c.name, fullName: c.name, count };
      }).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
    }
  }, [data, filteredMembers, facFilter]);

  // Data for Table
  const tableRows = useMemo(() => {
    if (!data) return [];
    let rows = [];
    if (facFilter === "all") {
      rows = data.faculties.map(f => {
        const ms = filteredMembers.filter(m => m.facultyId === f.id);
        const cE = ms.filter(m => classify(m.trainingScore) === 'excellent').length;
        const cG = ms.filter(m => classify(m.trainingScore) === 'good').length;
        const cA = ms.filter(m => classify(m.trainingScore) === 'average').length;
        const cP = ms.filter(m => classify(m.trainingScore) === 'poor').length;
        const cParty = ms.filter(m => m.partyStatus !== 'member').length;
        return { id: f.id, name: f.name, total: ms.length, cE, cG, cA, cP, cParty };
      });
    } else {
      rows = data.classes.filter(c => c.facultyId === facFilter).map(c => {
        const ms = filteredMembers.filter(m => m.classId === c.id);
        const cE = ms.filter(m => classify(m.trainingScore) === 'excellent').length;
        const cG = ms.filter(m => classify(m.trainingScore) === 'good').length;
        const cA = ms.filter(m => classify(m.trainingScore) === 'average').length;
        const cP = ms.filter(m => classify(m.trainingScore) === 'poor').length;
        const cParty = ms.filter(m => m.partyStatus !== 'member').length;
        return { id: c.id, name: c.name, total: ms.length, cE, cG, cA, cP, cParty };
      });
    }

    if (sortConfig) {
      rows.sort((a, b) => {
        const valA = a[sortConfig.key as keyof typeof a];
        const valB = b[sortConfig.key as keyof typeof b];
        if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows.filter(r => r.total > 0);
  }, [data, filteredMembers, facFilter, sortConfig]);

  const totals = tableRows.reduce((acc, r) => ({
    total: acc.total + r.total,
    cE: acc.cE + r.cE,
    cG: acc.cG + r.cG,
    cA: acc.cA + r.cA,
    cP: acc.cP + r.cP,
    cParty: acc.cParty + r.cParty
  }), { total: 0, cE: 0, cG: 0, cA: 0, cP: 0, cParty: 0 });

  const handleSort = (key: string) => {
    let dir: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.dir === 'desc') {
      dir = 'asc';
    }
    setSortConfig({ key, dir });
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="ml-1 size-3 text-muted-foreground/50 inline-block" />;
    return <ArrowUpDown className="ml-1 size-3 text-foreground inline-block" />;
  };

  const renderCell = (val: number, total: number) => {
    if (total === 0) return <span className="tabular-nums">-</span>;
    const pct = Math.round((val / total) * 100);
    return (
      <div className="flex justify-end items-center gap-1.5 tabular-nums">
        <span className={val > 0 ? "font-medium" : "text-muted-foreground"}>{val}</span>
        <span className="text-muted-foreground text-[11px] w-8 text-right bg-muted/30 px-1 rounded">({pct}%)</span>
      </div>
    );
  };

  const exportXLSX = async () => {
    setExportingExcel(true);
    try {
      const res = await exportMembersToExcelFn();
      const bin = atob(res.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao-cao-doan-vien-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất " + res.count + " bản ghi ra file Excel");
    } catch (e: any) {
      toast.error("Lỗi xuất Excel: " + (e.message || "Không rõ"));
    } finally {
      setExportingExcel(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Đơn vị", "Tổng ĐV", "Xuất sắc", "Khá", "Trung bình", "Yếu", "Cảm tình Đảng"];
    const csvRows = [headers.join(",")];
    tableRows.forEach(r => {
      csvRows.push([`"${r.name}"`, r.total, r.cE, r.cG, r.cA, r.cP, r.cParty].join(","));
    });
    csvRows.push(["Tổng cộng", totals.total, totals.cE, totals.cG, totals.cA, totals.cP, totals.cParty].join(","));

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất file CSV thành công!");
  };

  const exportPDF = () => {
    window.print();
  };

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-[50vh]"><Loader2 className="animate-spin size-6 mr-2" /> Đang tải dữ liệu...</div>;
  const { faculties, classes } = data;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded shadow-md p-3 text-sm">
          <p className="font-medium mb-1">{payload[0].payload.fullName || label}</p>
          <p className="text-muted-foreground">Số lượng: <span className="font-semibold text-foreground">{payload[0].value}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">Báo cáo & Phân tích</h1>
        <p className="text-sm text-muted-foreground">Phân tích dữ liệu đoàn viên và xuất báo cáo chi tiết.</p>
      </div>

      {/* 1. Top Filters */}
      <Card className="print:hidden bg-muted/20 border-dashed">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm mr-2 shrink-0">
            <Filter className="size-4" /> Bộ lọc:
          </div>
          <Select value={cohortFilter} onValueChange={(v) => { setCohortFilter(v); setClsFilter("all"); }}>
            <SelectTrigger className="w-full sm:w-[130px] bg-background"><SelectValue placeholder="Khóa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả Khóa</SelectItem>
              {cohorts.map((c) => <SelectItem key={c} value={c}>Khóa {c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={facFilter} onValueChange={(v) => { setFacFilter(v); setClsFilter("all"); }}>
            <SelectTrigger className="w-full sm:w-[200px] bg-background"><SelectValue placeholder="Khoa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả khoa</SelectItem>
              {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={clsFilter} onValueChange={setClsFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background"><SelectValue placeholder="Lớp" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              {classes.filter((c) => 
                (facFilter === "all" || c.facultyId === facFilter) &&
                (cohortFilter === "all" || c.name.includes(`DH${cohortFilter}-`))
              ).map((c) =>
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto text-sm text-muted-foreground bg-background px-3 py-1.5 rounded border shadow-sm">
            Tổng: <strong className="text-foreground">{filteredMembers.length}</strong> đoàn viên
          </div>
        </CardContent>
      </Card>

      {/* 2. Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Tỷ lệ Xếp loại rèn luyện</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] pb-4">
            {pieData.reduce((a, b) => a + b.value, 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Không có dữ liệu</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">
              Phân bố đoàn viên theo {facFilter === "all" ? "Khoa" : "Lớp"}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] pb-4">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <RechartsTooltip cursor={{ fill: '#f3f4f6' }} content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Không có dữ liệu</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Data Table */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg">Bảng kê chi tiết</CardTitle>
            <CardDescription className="print:hidden">Số liệu chi tiết xếp loại theo từng đơn vị</CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="print:hidden" disabled={exportingExcel}>
                {exportingExcel ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />}
                Xuất dữ liệu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={exportXLSX} className="cursor-pointer">
                <FileSpreadsheet className="mr-2 size-4 text-green-600" />
                <span>Xuất Excel (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCSV} className="cursor-pointer">
                <FileText className="mr-2 size-4 text-blue-600" />
                <span>Xuất CSV (.csv)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF} className="cursor-pointer">
                <Printer className="mr-2 size-4 text-orange-600" />
                <span>In / Xuất PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('name')}>
                    Đơn vị {renderSortIcon('name')}
                  </th>
                  <th className="px-4 py-3 font-medium text-right cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('total')}>
                    Tổng ĐV {renderSortIcon('total')}
                  </th>
                  <th className="px-4 py-3 font-medium text-right cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('cE')}>
                    Xuất sắc {renderSortIcon('cE')}
                  </th>
                  <th className="px-4 py-3 font-medium text-right cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('cG')}>
                    Khá {renderSortIcon('cG')}
                  </th>
                  <th className="px-4 py-3 font-medium text-right cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('cA')}>
                    Trung bình {renderSortIcon('cA')}
                  </th>
                  <th className="px-4 py-3 font-medium text-right cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('cP')}>
                    Yếu {renderSortIcon('cP')}
                  </th>
                  <th className="px-4 py-3 font-medium text-right cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSort('cParty')}>
                    Cảm tình Đảng {renderSortIcon('cParty')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length > 0 ? tableRows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-right font-semibold">{r.total}</td>
                    <td className="px-4 py-3">{renderCell(r.cE, r.total)}</td>
                    <td className="px-4 py-3">{renderCell(r.cG, r.total)}</td>
                    <td className="px-4 py-3">{renderCell(r.cA, r.total)}</td>
                    <td className="px-4 py-3">{renderCell(r.cP, r.total)}</td>
                    <td className="px-4 py-3">{renderCell(r.cParty, r.total)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Không có dữ liệu thỏa mãn bộ lọc</td>
                  </tr>
                )}
              </tbody>
              {tableRows.length > 0 && (
                <tfoot className="bg-primary/5 font-medium border-t">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-primary">Tổng cộng</td>
                    <td className="px-4 py-3 text-right font-bold text-primary tabular-nums">{totals.total}</td>
                    <td className="px-4 py-3">{renderCell(totals.cE, totals.total)}</td>
                    <td className="px-4 py-3">{renderCell(totals.cG, totals.total)}</td>
                    <td className="px-4 py-3">{renderCell(totals.cA, totals.total)}</td>
                    <td className="px-4 py-3">{renderCell(totals.cP, totals.total)}</td>
                    <td className="px-4 py-3">{renderCell(totals.cParty, totals.total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}