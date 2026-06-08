import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { getDashboardDataFn } from "@/lib/api/audit.functions";
import { classify, CLASSIFICATION_LABELS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarCheck, ClipboardCheck, Wallet, AlertCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardDataFn(),
  });

  if (isLoading || !data) {
    return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;
  }

  const { members, events, fees, faculties } = data;

  const totalMembers = members.length;
  const activeEvents = events.filter((e) => e.status === "approved").length;
  const pending = events.filter((e) => e.status === "pending").length;
  const totalFees = fees.filter((f) => f.paid).reduce((s, f) => s + f.amount, 0);

  const facultyData = useMemo(
    () => faculties.map((f) => ({
      name: f.code,
      "Đoàn viên": members.filter((m) => m.facultyId === f.id).length,
    })),
    [faculties, members],
  );

  const classifData = useMemo(() => {
    const counts: Record<string, number> = { excellent: 0, good: 0, average: 0, poor: 0 };
    members.forEach((m) => counts[classify(m.trainingScore)]++);
    
    const colors = {
      excellent: "#10b981", // Xanh lá - Xuất sắc
      good: "#3b82f6",      // Xanh dương - Tốt
      average: "#f59e0b",   // Vàng - Khá/TB
      poor: "#ef4444"       // Đỏ - Yếu
    };

    return Object.entries(counts).map(([k, v]) => ({ 
      name: CLASSIFICATION_LABELS[k as keyof typeof CLASSIFICATION_LABELS], 
      value: v,
      color: colors[k as keyof typeof colors]
    }));
  }, [members]);

  const upcoming = [...events].sort((a, b) => a.startAt.localeCompare(b.startAt)).slice(0, 5);

  const todos = [
    ...events.filter((e) => e.status === "pending").map((e) => ({ kind: "approval", label: `Hoạt động chờ duyệt: ${e.title}` })),
    ...members.filter((m) => !m.feePaid).slice(0, 3).map((m) => ({ kind: "fee", label: `Đoàn viên chưa nộp đoàn phí: ${m.fullName}` })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">Số liệu nhanh và các việc cần xử lý.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Tổng đoàn viên" value={totalMembers.toLocaleString("vi")} hint={`${faculties.length} khoa`} />
        <KpiCard icon={CalendarCheck} label="Hoạt động đang diễn ra" value={activeEvents} hint="Đã duyệt" />
        <KpiCard icon={ClipboardCheck} label="Chờ phê duyệt" value={pending} hint="Yêu cầu/Hoạt động" />
        <KpiCard icon={Wallet} label="Đoàn phí đã thu" value={totalFees.toLocaleString("vi") + " ₫"} hint="Kỳ hiện tại" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Đoàn viên theo Khoa</CardTitle>
            <CardDescription>Phân bố toàn trường</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={facultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="Đoàn viên" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Xếp loại rèn luyện</CardTitle>
            <CardDescription>Toàn trường</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={classifData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40} paddingAngle={2}>
                  {classifData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend
                  formatter={(value, entry: any) => (
                    <span style={{ color: "var(--foreground)", fontSize: 12 }}>{value}</span>
                  )}
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12 }}
                  content={({ payload }) => (
                    <ul className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2">
                      {payload?.map((entry: any, i: number) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs">
                          <span className="inline-block size-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-foreground/80">{entry.value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertCircle className="size-4 text-primary" /> Việc cần xử lý</CardTitle>
            <CardDescription>Yêu cầu chờ duyệt và mục chưa hoàn tất</CardDescription>
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có việc cần xử lý.</p>
            ) : (
              <ul className="space-y-2">
                {todos.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 text-sm">
                    <Badge variant={t.kind === "approval" ? "default" : "secondary"} className="mt-0.5">
                      {t.kind === "approval" ? "Duyệt" : "Đoàn phí"}
                    </Badge>
                    <span className="flex-1">{t.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="size-4 text-primary" /> Lịch hoạt động sắp tới</CardTitle>
            <CardDescription>5 hoạt động gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center gap-3 p-3 rounded-lg border text-sm">
                  <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center text-xs font-semibold leading-tight text-center">
                    {e.startAt.slice(8, 10)}<br />{e.startAt.slice(5, 7)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/app/events" className="font-medium truncate block hover:underline">{e.title}</Link>
                    <p className="text-xs text-muted-foreground truncate">{e.location} · {e.startAt.replace("T", " ")}</p>
                  </div>
                  <Badge variant={e.status === "approved" ? "default" : "secondary"}>{e.status === "approved" ? "Đã duyệt" : e.status === "pending" ? "Chờ duyệt" : e.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: any; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <Icon className="size-4" />
          </div>
        </div>
        <p className="text-2xl font-semibold mt-2">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}