import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { scopedMembers } from "@/lib/scope";
import { classify, CLASSIFICATION_LABELS, PARTY_LABELS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/members")({ component: MembersPage });

function MembersPage() {
  const { user, members, faculties, classes } = useStore();
  const [q, setQ] = useState("");
  const [facFilter, setFacFilter] = useState("all");
  const [clsFilter, setClsFilter] = useState("all");

  const list = useMemo(() => {
    let l = scopedMembers(members, user!);
    if (facFilter !== "all") l = l.filter((m) => m.facultyId === facFilter);
    if (clsFilter !== "all") l = l.filter((m) => m.classId === clsFilter);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((m) => m.fullName.toLowerCase().includes(s) || m.code.toLowerCase().includes(s));
    }
    return l;
  }, [members, user, q, facFilter, clsFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Đoàn viên</h1>
        <p className="text-sm text-muted-foreground">Danh sách hồ sơ Đoàn viên (Mẫu 2C)</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc mã..." className="pl-9" />
            </div>
            <Select value={facFilter} onValueChange={(v) => { setFacFilter(v); setClsFilter("all"); }}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoa</SelectItem>
                {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={clsFilter} onValueChange={setClsFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                {classes.filter((c) => facFilter === "all" || c.facultyId === facFilter).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-3 py-2.5 font-medium">Mã SV</th>
                    <th className="px-3 py-2.5 font-medium">Họ tên</th>
                    <th className="px-3 py-2.5 font-medium">Lớp</th>
                    <th className="px-3 py-2.5 font-medium">Khoa</th>
                    <th className="px-3 py-2.5 font-medium text-right">Điểm RL</th>
                    <th className="px-3 py-2.5 font-medium">Xếp loại</th>
                    <th className="px-3 py-2.5 font-medium">Đảng</th>
                    <th className="px-3 py-2.5 font-medium">Đoàn phí</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => {
                    const cls = classify(m.trainingScore);
                    return (
                      <tr key={m.id} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono text-xs">{m.code}</td>
                        <td className="px-3 py-2 font-medium">{m.fullName}</td>
                        <td className="px-3 py-2 text-muted-foreground">{classes.find((c) => c.id === m.classId)?.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{faculties.find((f) => f.id === m.facultyId)?.code}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{m.trainingScore}</td>
                        <td className="px-3 py-2">
                          <Badge variant={cls === "excellent" ? "default" : cls === "good" ? "secondary" : cls === "poor" ? "destructive" : "outline"}>
                            {CLASSIFICATION_LABELS[cls]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs">{PARTY_LABELS[m.partyStatus]}</td>
                        <td className="px-3 py-2">
                          <Badge variant={m.feePaid ? "secondary" : "destructive"} className="font-normal">
                            {m.feePaid ? "Đã nộp" : "Chưa nộp"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link to="/app/members/$id" params={{ id: m.id }}><Eye className="size-4" /></Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {list.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">Không có đoàn viên nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Hiển thị {list.length.toLocaleString("vi")} bản ghi</p>
        </CardContent>
      </Card>
    </div>
  );
}