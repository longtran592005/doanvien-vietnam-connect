import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Shield, Lock, Unlock, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { getAccountsFn, createAccountFn, updateAccountFn, deleteAccountFn, toggleLockAccountFn } from "@/lib/api/accounts.functions";
import { getMembersFn } from "@/lib/api/members.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<any>(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => getAccountsFn(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: () => getMembersFn(),
  });

  const filtered = accounts.filter(
    (a) =>
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleLockMut = useMutation({
    mutationFn: (args: { id: string; isLocked: boolean }) => toggleLockAccountFn({ data: args }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Đã cập nhật trạng thái khóa tài khoản.");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAccountFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Đã xóa tài khoản.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý Tài khoản</h2>
          <p className="text-muted-foreground text-sm mt-1">Quản lý, phân quyền và khóa tài khoản người dùng hệ thống.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="size-4" /> Thêm tài khoản
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã đăng nhập, họ tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Mã Đăng Nhập</TableHead>
              <TableHead>Họ & Tên</TableHead>
              <TableHead>Phân Quyền</TableHead>
              <TableHead>Ngày Tạo</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Đang tải dữ liệu...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Không tìm thấy tài khoản nào.</TableCell>
              </TableRow>
            ) : (
              filtered.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium font-mono">{acc.code}</TableCell>
                  <TableCell>{acc.name}</TableCell>
                  <TableCell>
                    <Badge variant={acc.role === 'admin' ? 'default' : 'secondary'} className="font-normal">
                      {ROLE_LABELS[acc.role as Role] || acc.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(acc.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!acc.isLocked}
                        onCheckedChange={(v) => toggleLockMut.mutate({ id: acc.id, isLocked: !v })}
                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-destructive"
                      />
                      <span className="text-xs font-medium">
                        {acc.isLocked ? <span className="text-destructive flex items-center gap-1"><Lock className="size-3" /> Đã khóa</span> : <span className="text-emerald-500 flex items-center gap-1"><Unlock className="size-3" /> Hoạt động</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditOpen(acc)}>
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn xóa tài khoản ${acc.code}?`)) {
                        deleteMut.mutate(acc.id);
                      }
                    }}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {addOpen && (
        <AccountDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          members={members}
        />
      )}
      
      {editOpen && (
        <AccountDialog
          open={!!editOpen}
          onOpenChange={(v) => !v && setEditOpen(null)}
          account={editOpen}
          members={members}
        />
      )}
    </div>
  );
}

function AccountDialog({ open, onOpenChange, account, members }: { open: boolean; onOpenChange: (v: boolean) => void; account?: any; members: any[] }) {
  const queryClient = useQueryClient();
  const isEdit = !!account;
  const [code, setCode] = useState(account?.code || "");
  const [name, setName] = useState(account?.name || "");
  const [role, setRole] = useState(account?.role || "member");
  const [memberId, setMemberId] = useState(account?.memberId || "none");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const needsMemberLink = ["member", "class_secretary"].includes(role);

  const mut = useMutation({
    mutationFn: async () => {
      const payload: any = { code, name, role, memberId: memberId === "none" ? null : memberId };
      if (password) payload.password = password;
      if (isEdit) {
        return updateAccountFn({ data: { id: account.id, patch: payload } });
      } else {
        return createAccountFn({ data: payload });
      }
    },
    onSuccess: (res) => {
      if (res.error) {
        setErr(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(isEdit ? "Cập nhật thành công!" : "Thêm mới tài khoản thành công!");
      onOpenChange(false);
    }
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!code || !name || !role) {
      setErr("Vui lòng điền đủ thông tin."); return;
    }
    if (needsMemberLink && memberId === "none") {
      setErr("Vai trò Đoàn viên/Bí thư yêu cầu liên kết với một hồ sơ Đoàn viên."); return;
    }
    mut.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật tài khoản" : "Thêm mới tài khoản"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Mã đăng nhập</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SV... / CB..." />
          </div>
          <div className="space-y-2">
            <Label>Họ và tên</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập họ tên" />
          </div>
          <div className="space-y-2">
            <Label>Phân quyền</Label>
            <Select value={role} onValueChange={(v) => { setRole(v); if (!["member", "class_secretary"].includes(v)) setMemberId("none"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {needsMemberLink && (
            <div className="space-y-2">
              <Label>Liên kết hồ sơ Đoàn viên</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger><SelectValue placeholder="Chọn đoàn viên..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">--- Chọn Đoàn viên ---</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.code} - {m.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Mật khẩu {isEdit && "(bỏ trống nếu không đổi)"}</Label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? "********" : "TBU@2026 (Mặc định)"} />
          </div>

          {err && <p className="text-sm text-destructive">{err}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={mut.isPending}>Lưu tài khoản</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
