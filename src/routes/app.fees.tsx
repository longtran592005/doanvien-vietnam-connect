import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardDataFn } from "@/lib/api/audit.functions";
import { toggleFeeFn, createFeeCampaignFn, archiveFeeCampaignFn } from "@/lib/api/fees.functions";
import { can } from "@/lib/permissions";
import { NoAccess } from "./app.organization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Wallet, Check, X, ArrowLeft, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/fees")({ component: FeesPage });

function FeesPage() {
  const { user } = useStore();
  if (!can(user?.role, "fees.view")) return <NoAccess />;
  const canManage = can(user?.role, "fees.manage");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardDataFn(),
  });

  const queryClient = useQueryClient();
  const toggleMut = useMutation({
    mutationFn: (id: string) => toggleFeeFn({ data: { id, actor: user?.code } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => archiveFeeCampaignFn({ data: { id, actor: user?.code } }),
    onSuccess: () => {
      toast.success("Đã xóa/ẩn đợt thu đoàn phí.");
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => createFeeCampaignFn({ data: { ...payload, actor: user?.code } }),
    onSuccess: () => {
      toast.success("Tạo đợt thu mới thành công.");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
  });

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Filters for Detail view
  const [q, setQ] = useState("");
  const [facFilter, setFacFilter] = useState("all");
  const [status, setStatus] = useState("all");

  // Create Form State
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState(30000);
  const [targetType, setTargetType] = useState<"all"|"faculty"|"class">("all");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");

  const rows = useMemo(() => {
    if (!data || !selectedCampaignId) return [];
    return data.fees.filter(f => f.campaignId === selectedCampaignId).map((f) => {
      const m = data.members.find((x) => x.id === f.memberId)!;
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
  }, [data, selectedCampaignId, q, facFilter, status]);

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;
  const { faculties, classes, feeCampaigns, fees } = data;

  const handleCreate = () => {
    if (!newTitle.trim()) {
      toast.error("Vui lòng nhập tên đợt thu");
      return;
    }
    if (newAmount <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      return;
    }
    
    let tIds: string[] = [];
    if (targetType === "faculty" && selectedFaculty) tIds = [selectedFaculty];
    if (targetType === "class") tIds = selectedClasses;

    if (targetType !== "all" && tIds.length === 0) {
      toast.error("Vui lòng chọn đối tượng thu");
      return;
    }

    createMut.mutate({
      title: newTitle.trim(),
      amount: newAmount,
      targetType,
      targetIds: tIds,
    });
  };

  const handleToggleClass = (id: string) => {
    setSelectedClasses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (selectedCampaignId) {
    const campaign = feeCampaigns?.find(c => c.id === selectedCampaignId);
    if (!campaign) return null;

    const totalPaid = rows.filter((r) => r.fee.paid).reduce((s, r) => s + r.fee.amount, 0);
    const totalDue = rows.filter((r) => !r.fee.paid).reduce((s, r) => s + r.fee.amount, 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedCampaignId(null)}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{campaign.title}</h1>
            <p className="text-sm text-muted-foreground">Chi tiết danh sách thu đoàn phí.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Đã thu" value={totalPaid.toLocaleString("vi") + " ₫"} tone="primary" />
          <KpiCard label="Còn nợ" value={totalDue.toLocaleString("vi") + " ₫"} tone="destructive" />
          <KpiCard label="Số người" value={rows.length} tone="muted" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách đoàn viên</CardTitle>
            <CardDescription>Mức thu: {campaign.amount.toLocaleString("vi")} ₫</CardDescription>
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
                        <td className="px-3 py-2 text-right tabular-nums">{fee.amount.toLocaleString("vi")} ₫</td>
                        <td className="px-3 py-2">
                          <Badge variant={fee.paid ? "default" : "destructive"}>{fee.paid ? "Đã nộp" : "Chưa nộp"}</Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {canManage && (
                            <Button size="sm" variant={fee.paid ? "ghost" : "outline"} onClick={() => toggleMut.mutate(fee.id)}>
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

  // OVERVIEW MODE
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý Đoàn phí</h1>
          <p className="text-sm text-muted-foreground">Theo dõi và tạo các đợt thu đoàn phí mới.</p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-2" />
            Tạo đợt thu
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {feeCampaigns?.map(camp => {
          const campFees = fees.filter(f => f.campaignId === camp.id);
          const paidCount = campFees.filter(f => f.paid).length;
          const totalCount = campFees.length;
          const pct = totalCount === 0 ? 0 : Math.round((paidCount / totalCount) * 100);

          return (
            <Card key={camp.id} className="flex flex-col hover:border-primary/50 transition cursor-pointer" onClick={() => setSelectedCampaignId(camp.id)}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base line-clamp-1" title={camp.title}>{camp.title}</CardTitle>
                <CardDescription className="line-clamp-1">{camp.description || "Không có mô tả"}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Mức thu:</span>
                  <span className="font-semibold">{camp.amount.toLocaleString("vi")} ₫</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Tiến độ nộp:</span>
                  <span className="font-medium">{paidCount} / {totalCount}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between border-t mt-3 pt-3">
                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                  <Users className="size-3 mr-1" />
                  {camp.targetType === "all" ? "Toàn trường" : camp.targetType === "faculty" ? "Theo Khoa" : "Theo Lớp"}
                </Badge>
                {canManage && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Bạn có chắc chắn muốn xóa/ẩn đợt thu này? Toàn bộ trạng thái đã nộp trong đợt này sẽ bị ẩn.")) {
                        archiveMut.mutate(camp.id);
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
        {feeCampaigns?.length === 0 && (
          <div className="col-span-full p-8 text-center border rounded-xl bg-muted/20 border-dashed">
            <Wallet className="size-8 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-foreground font-medium">Chưa có đợt thu đoàn phí nào</p>
            <p className="text-sm text-muted-foreground mb-4">Hãy tạo một đợt thu mới để bắt đầu theo dõi.</p>
            {canManage && <Button variant="outline" onClick={() => setCreateOpen(true)}>Tạo đợt thu ngay</Button>}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo đợt thu mới</DialogTitle>
            <DialogDescription>Thiết lập thông tin và đối tượng thu đoàn phí.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tên đợt thu</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="VD: Đoàn phí HK1 2026" />
            </div>
            <div className="space-y-2">
              <Label>Mức thu (VNĐ)</Label>
              <Input type="number" value={newAmount} onChange={e => setNewAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Đối tượng thu</Label>
              <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả đoàn viên toàn trường</SelectItem>
                  <SelectItem value="faculty">Theo Khoa cụ thể</SelectItem>
                  <SelectItem value="class">Chọn từng Lớp cụ thể</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {targetType === "faculty" && (
              <div className="space-y-2">
                <Label>Chọn Khoa</Label>
                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                  <SelectTrigger><SelectValue placeholder="Chọn một khoa..." /></SelectTrigger>
                  <SelectContent>
                    {faculties.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {targetType === "class" && (
              <div className="space-y-2">
                <Label>Chọn các lớp</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                  {classes.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <Checkbox 
                        checked={selectedClasses.includes(c.id)} 
                        onCheckedChange={() => handleToggleClass(c.id)} 
                      />
                      {c.name} <span className="text-muted-foreground text-xs">({faculties.find(f => f.id === c.facultyId)?.code})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending ? "Đang tạo..." : "Tạo đợt thu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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