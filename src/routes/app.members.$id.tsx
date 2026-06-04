import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardDataFn } from "@/lib/api/audit.functions";
import { updateMemberFn } from "@/lib/api/members.functions";
import { can } from "@/lib/permissions";
import { classify, CLASSIFICATION_LABELS, PARTY_LABELS, type PartyStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/members/$id")({ component: MemberDetail });

function MemberDetail() {
  const { id } = useParams({ from: "/app/members/$id" });
  const { user } = useStore();
  
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardDataFn(),
  });

  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (patch: any) => updateMemberFn({ data: { id: id as string, patch } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Đã lưu hồ sơ");
    }
  });

  const member = data?.members.find((m) => m.id === id);
  const editable = can(user?.role, "members.edit");
  const [draft, setDraft] = useState(member);

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>;
  if (!member) return <p>Không tìm thấy hồ sơ.</p>;
  
  const { faculties, classes, training } = data;
  const d = draft ?? member;
  const cls = classify(d.trainingScore);

  const update = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setDraft({ ...d, [k]: v });
  const save = () => { updateMutation.mutate(d); };

  const logs = training.filter((t) => t.memberId === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/app/members"><ArrowLeft className="size-4 mr-1" /> Quay lại</Link></Button>
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <div className="size-24 rounded-2xl bg-primary text-primary-foreground grid place-items-center text-2xl font-semibold">
          {d.fullName.split(" ").slice(-1)[0].slice(0, 1)}
        </div>
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-2xl font-semibold">{d.fullName}</h1>
          <p className="text-sm text-muted-foreground font-mono">{d.code}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge>{faculties.find((f) => f.id === d.facultyId)?.name}</Badge>
            <Badge variant="secondary">{classes.find((c) => c.id === d.classId)?.name}</Badge>
            <Badge variant={cls === "excellent" ? "default" : cls === "poor" ? "destructive" : "outline"}>
              Rèn luyện: {d.trainingScore} — {CLASSIFICATION_LABELS[cls]}
            </Badge>
            <Badge variant="outline">{PARTY_LABELS[d.partyStatus]}</Badge>
          </div>
        </div>
        {editable && <Button onClick={save}><Save className="size-4 mr-1" /> Lưu thay đổi</Button>}
      </div>

      <Tabs defaultValue="basic">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
          <TabsTrigger value="family">Quan hệ gia đình</TabsTrigger>
          <TabsTrigger value="academic">Học tập / Công tác</TabsTrigger>
          <TabsTrigger value="skills">Tin học & Ngoại ngữ</TabsTrigger>
          <TabsTrigger value="finance">Tài chính</TabsTrigger>
          <TabsTrigger value="awards">Khen thưởng & Kỷ luật</TabsTrigger>
          <TabsTrigger value="party">Phát triển Đảng</TabsTrigger>
          <TabsTrigger value="logs">Lịch sử điểm</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card><CardContent className="p-6 grid md:grid-cols-2 gap-4">
            <Field label="Họ và tên" value={d.fullName} edit={editable} onChange={(v) => update("fullName", v)} />
            <Field label="Mã sinh viên" value={d.code} edit={false} />
            <Field label="Ngày sinh" value={d.dob} edit={editable} type="date" onChange={(v) => update("dob", v)} />
            <div className="space-y-1.5">
              <Label>Giới tính</Label>
              <Select value={d.gender} onValueChange={(v) => update("gender", v as any)} disabled={!editable}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="M">Nam</SelectItem><SelectItem value="F">Nữ</SelectItem></SelectContent>
              </Select>
            </div>
            <Field label="Điện thoại" value={d.phone} edit={editable} onChange={(v) => update("phone", v)} />
            <Field label="Email" value={d.email} edit={editable} type="email" onChange={(v) => update("email", v)} />
            <Field label="Ngày vào Đoàn" value={d.joinDate} edit={editable} type="date" onChange={(v) => update("joinDate", v)} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="family"><TextCard label="Hoàn cảnh gia đình" value={d.family ?? ""} edit={editable} onChange={(v) => update("family", v)} /></TabsContent>
        <TabsContent value="academic"><TextCard label="Quá trình học tập & công tác" value={d.academicHistory ?? ""} edit={editable} onChange={(v) => update("academicHistory", v)} /></TabsContent>
        <TabsContent value="skills">
          <Card><CardContent className="p-6 grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Tin học</Label>
              <Textarea value={d.itSkills ?? ""} disabled={!editable} onChange={(e) => update("itSkills", e.target.value)} rows={5} /></div>
            <div className="space-y-1.5"><Label>Ngoại ngữ</Label>
              <Textarea value={d.languages ?? ""} disabled={!editable} onChange={(e) => update("languages", e.target.value)} rows={5} /></div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="finance">
          <Card><CardContent className="p-6">
            <p className="text-sm">Trạng thái đoàn phí kỳ hiện tại: {d.feePaid
              ? <Badge>Đã nộp</Badge> : <Badge variant="destructive">Chưa nộp</Badge>}</p>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="awards">
          <Card><CardContent className="p-6 grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Khen thưởng</Label>
              <Textarea value={d.awards ?? ""} disabled={!editable} onChange={(e) => update("awards", e.target.value)} rows={5} /></div>
            <div className="space-y-1.5"><Label>Kỷ luật</Label>
              <Textarea value={d.disciplines ?? ""} disabled={!editable} onChange={(e) => update("disciplines", e.target.value)} rows={5} /></div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="party">
          <Card>
            <CardHeader><CardTitle>Quá trình phát triển Đảng</CardTitle>
              <CardDescription>Đoàn viên → Cảm tình Đảng → Đảng viên</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {(["member", "aspirant", "party_member"] as PartyStatus[]).map((p, i) => (
                  <div key={p} className={"flex-1 p-4 rounded-lg border " + (d.partyStatus === p ? "border-primary bg-primary/5" : "")}>
                    <p className="text-xs text-muted-foreground">Giai đoạn {i + 1}</p>
                    <p className="font-medium">{PARTY_LABELS[p]}</p>
                  </div>
                ))}
              </div>
              {editable && (
                <div className="space-y-1.5">
                  <Label>Cập nhật trạng thái</Label>
                  <Select value={d.partyStatus} onValueChange={(v) => update("partyStatus", v as PartyStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["member", "aspirant", "party_member"] as PartyStatus[]).map((p) =>
                        <SelectItem key={p} value={p}>{PARTY_LABELS[p]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <Card><CardContent className="p-6">
            {logs.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có nhật ký điểm.</p> : (
              <ul className="space-y-2">
                {logs.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 p-3 rounded-md border text-sm">
                    <Badge variant={l.type === "reward" ? "default" : "destructive"}>{l.delta > 0 ? `+${l.delta}` : l.delta}</Badge>
                    <span className="flex-1">{l.reason}</span>
                    <span className="text-xs text-muted-foreground">{l.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value, edit, type = "text", onChange }: { label: string; value: string; edit: boolean; type?: string; onChange?: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} disabled={!edit} onChange={(e) => onChange?.(e.target.value)} />
    </div>
  );
}
function TextCard({ label, value, edit, onChange }: { label: string; value: string; edit: boolean; onChange: (v: string) => void }) {
  return (
    <Card><CardContent className="p-6 space-y-2">
      <Label>{label}</Label>
      <Textarea value={value} disabled={!edit} onChange={(e) => onChange(e.target.value)} rows={8} />
    </CardContent></Card>
  );
}