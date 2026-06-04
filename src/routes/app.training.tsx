import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardDataFn } from "@/lib/api/audit.functions";
import { addTrainingLogFn, addBulkTrainingLogFn } from "@/lib/api/training.functions";
import { can } from "@/lib/permissions";
import { scopedMembers } from "@/lib/scope";
import { classify, CLASSIFICATION_LABELS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, TrendingUp, TrendingDown, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/training")({ component: TrainingPage });

function TrainingPage() {
  const { user } = useStore();
  
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardDataFn(),
  });

  const queryClient = useQueryClient();
  const addMut = useMutation({
    mutationFn: (d: any) => addTrainingLogFn({ data: d }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
  });
  
  const addBulkMut = useMutation({
    mutationFn: (d: any) => addBulkTrainingLogFn({ data: d }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-data"] }),
  });

  const list = useMemo(() => {
    if (!data) return [];
    return scopedMembers(data.members, user!);
  }, [data, user]);
  
  const allowed = can(user?.role, "training.grade");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("single"); // "single" | "bulk"
  
  // Single mode state
  const [memberId, setMemberId] = useState("");
  
  // Bulk mode state
  const [classId, setClassId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Shared state
  const [type, setType] = useState<"reward" | "violation">("reward");
  const [delta, setDelta] = useState("5");
  const [reason, setReason] = useState("");

  const classMembers = useMemo(() => {
    if (!classId) return [];
    return list.filter(m => m.classId === classId);
  }, [list, classId]);

  const submit = () => {
    const n = Number(delta);
    if (!Number.isFinite(n) || n <= 0) return toast.error("Điểm phải là số dương");
    if (!reason.trim()) return toast.error("Nhập lý do");
    
    if (mode === "single") {
      if (!memberId) return toast.error("Chọn đoàn viên");
      addMut.mutate({
        memberId, date: new Date().toISOString().slice(0, 10),
        delta: type === "reward" ? n : -n,
        reason: reason.trim(), type, createdBy: user!.code,
      });
      toast.success("Đã ghi nhận điểm cá nhân");
    } else {
      if (!classId) return toast.error("Chọn lớp");
      if (selectedMembers.length === 0) return toast.error("Phải chọn ít nhất 1 thành viên");
      
      addBulkMut.mutate({
        memberIds: selectedMembers, 
        date: new Date().toISOString().slice(0, 10),
        delta: type === "reward" ? n : -n,
        reason: reason.trim(), type, createdBy: user!.code,
      });
      toast.success(`Đã ghi nhận điểm cho ${selectedMembers.length} người`);
    }
    
    // Reset state
    setMemberId(""); setClassId(""); setSelectedMembers([]); setReason(""); setDelta("5"); setOpen(false);
  };

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;
  const { training, members, classes } = data;

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const toggleAllClass = () => {
    if (selectedMembers.length === classMembers.length) {
      setSelectedMembers([]); // Unselect all
    } else {
      setSelectedMembers(classMembers.map(m => m.id)); // Select all
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rèn luyện & Kỷ luật</h1>
          <p className="text-sm text-muted-foreground">Cộng điểm tham gia, trừ điểm vi phạm.</p>
        </div>
        {allowed && (
          <Dialog open={open} onOpenChange={(o) => {
            setOpen(o);
            if (o && classId && selectedMembers.length === 0) {
              setSelectedMembers(classMembers.map(m => m.id));
            }
          }}>
            <DialogTrigger asChild><Button><Plus className="size-4 mr-1" /> Ghi nhận điểm</Button></DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Ghi nhận điểm rèn luyện</DialogTitle></DialogHeader>
              
              <Tabs value={mode} onValueChange={setMode} className="mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single">Cá nhân</TabsTrigger>
                  <TabsTrigger value="bulk">Tập thể (Theo lớp)</TabsTrigger>
                </TabsList>
                
                <div className="space-y-4 mt-4">
                  <TabsContent value="single" className="m-0 space-y-3">
                    <div>
                      <Label>Đoàn viên</Label>
                      <Select value={memberId} onValueChange={setMemberId}>
                        <SelectTrigger><SelectValue placeholder="Chọn đoàn viên..." /></SelectTrigger>
                        <SelectContent className="max-h-72">{list.map((m) => <SelectItem key={m.id} value={m.id}>{m.fullName} — {m.code}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="bulk" className="m-0 space-y-3">
                    <div>
                      <Label>Lớp</Label>
                      <Select value={classId} onValueChange={(v) => {
                        setClassId(v);
                        const clsMems = list.filter(m => m.classId === v);
                        setSelectedMembers(clsMems.map(m => m.id));
                      }}>
                        <SelectTrigger><SelectValue placeholder="Chọn lớp..." /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {classes.filter(c => list.some(m => m.classId === c.id)).map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {classId && classMembers.length > 0 && (
                      <div className="border rounded-md p-3 space-y-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2 cursor-pointer font-medium text-primary">
                            <Checkbox 
                              checked={selectedMembers.length === classMembers.length && classMembers.length > 0} 
                              onCheckedChange={toggleAllClass} 
                            />
                            Chọn tất cả ({selectedMembers.length}/{classMembers.length})
                          </Label>
                        </div>
                        <ScrollArea className="h-40 border rounded-md bg-background p-3">
                          <div className="space-y-3">
                            {classMembers.map(m => (
                              <div key={m.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`chk-${m.id}`} 
                                  checked={selectedMembers.includes(m.id)} 
                                  onCheckedChange={() => toggleMember(m.id)} 
                                />
                                <label htmlFor={`chk-${m.id}`} className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  {m.fullName} <span className="text-muted-foreground text-xs">({m.code})</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                    {classId && classMembers.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">Lớp này chưa có đoàn viên nào.</p>
                    )}
                  </TabsContent>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div><Label>Loại</Label>
                      <Select value={type} onValueChange={(v) => setType(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reward">Cộng điểm (Khen thưởng)</SelectItem>
                          <SelectItem value="violation">Trừ điểm (Kỷ luật)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Số điểm</Label><Input type="number" min={1} value={delta} onChange={(e) => setDelta(e.target.value)} /></div>
                  </div>
                  
                  <div>
                    <Label>Lý do</Label>
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="VD: Tham gia hiến máu nhân đạo 06/2026" />
                  </div>
                </div>
              </Tabs>
              
              <DialogFooter className="mt-4"><Button onClick={submit} disabled={mode === "bulk" && (!classId || selectedMembers.length === 0)}>Lưu</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Xếp loại theo đoàn viên</CardTitle><CardDescription>Tự động tính theo điểm hiện tại</CardDescription></CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground"><tr className="text-left">
                  <th className="px-3 py-2 font-medium">Họ tên</th>
                  <th className="px-3 py-2 font-medium text-right">Điểm</th>
                  <th className="px-3 py-2 font-medium">Xếp loại</th>
                </tr></thead>
                <tbody>
                  {list.slice(0, 15).map((m) => {
                    const cl = classify(m.trainingScore);
                    return (
                      <tr key={m.id} className="border-t">
                        <td className="px-3 py-2">{m.fullName}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{m.trainingScore}</td>
                        <td className="px-3 py-2">
                          <Badge variant={cl === "excellent" ? "default" : cl === "poor" ? "destructive" : "outline"}>{CLASSIFICATION_LABELS[cl]}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Nhật ký gần đây</CardTitle><CardDescription>Các điểm đã ghi nhận</CardDescription></CardHeader>
          <CardContent>
            {training.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có ghi nhận nào.</p>
            ) : (
              <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
                {training.map((l) => {
                  const m = members.find((x) => x.id === l.memberId);
                  return (
                    <li key={l.id} className="flex items-start gap-3 p-3 rounded-md border text-sm">
                      {l.type === "reward" ? <TrendingUp className="size-4 text-primary mt-0.5" /> : <TrendingDown className="size-4 text-destructive mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{m?.fullName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{l.reason}</p>
                      </div>
                      <Badge variant={l.delta > 0 ? "default" : "destructive"}>{l.delta > 0 ? `+${l.delta}` : l.delta}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}