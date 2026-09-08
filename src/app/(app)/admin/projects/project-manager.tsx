"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/select-field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import type { Project, ProjectStatus } from "@/lib/db/schema";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

const STATUSES: ProjectStatus[] = ["active", "paused", "completed"];
const STATUS_OPTIONS = STATUSES.map((s) => ({
  value: s,
  label: PROJECT_STATUS_LABELS[s],
}));

export function ProjectManager({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  // add form
  const [nc, setNc] = useState({ code: "", name: "", address: "", status: "active" as ProjectStatus });
  // edit form
  const [ec, setEc] = useState({ code: "", name: "", address: "", status: "active" as ProjectStatus });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createProject(nc);
    setLoading(false);
    if (!res.ok) return toast.error("Lỗi", { description: res.error });
    toast.success("Đã thêm công trình");
    setNc({ code: "", name: "", address: "", status: "active" });
    router.refresh();
  }

  function startEdit(p: Project) {
    setEditingId(p.id);
    setEc({
      code: p.code,
      name: p.name,
      address: p.address ?? "",
      status: p.status,
    });
  }

  async function handleSave(id: number) {
    setLoading(true);
    const res = await updateProject(id, ec);
    setLoading(false);
    if (!res.ok) return toast.error("Lỗi", { description: res.error });
    toast.success("Đã cập nhật");
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: number) {
    setLoading(true);
    const res = await deleteProject(id);
    setLoading(false);
    if (!res.ok) return toast.error("Không thể xóa", { description: res.error });
    toast.success("Đã xóa công trình");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Thêm công trình</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAdd}
            className="grid gap-2 sm:grid-cols-[140px_1fr_1fr_150px_auto]"
          >
            <Input
              placeholder="Mã"
              value={nc.code}
              onChange={(e) => setNc({ ...nc, code: e.target.value })}
              required
            />
            <Input
              placeholder="Tên công trình"
              value={nc.name}
              onChange={(e) => setNc({ ...nc, name: e.target.value })}
              required
            />
            <Input
              placeholder="Địa chỉ"
              value={nc.address}
              onChange={(e) => setNc({ ...nc, address: e.target.value })}
            />
            <SelectField
              value={nc.status}
              onChange={(v) => setNc({ ...nc, status: v as ProjectStatus })}
              options={STATUS_OPTIONS}
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Thêm
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead className="hidden md:table-cell">Địa chỉ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) =>
                editingId === p.id ? (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Input
                        value={ec.code}
                        onChange={(e) => setEc({ ...ec, code: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={ec.name}
                        onChange={(e) => setEc({ ...ec, name: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Input
                        value={ec.address}
                        onChange={(e) =>
                          setEc({ ...ec, address: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <SelectField
                        value={ec.status}
                        onChange={(v) =>
                          setEc({ ...ec, status: v as ProjectStatus })
                        }
                        options={STATUS_OPTIONS}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          onClick={() => handleSave(p.id)}
                          disabled={loading}
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.code}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {p.address ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {PROJECT_STATUS_LABELS[p.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => startEdit(p)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(p)}
                          disabled={loading}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Xóa công trình?"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xóa "${deleteTarget.name}" (${deleteTarget.code})? Hành động này không thể hoàn tác.`
            : undefined
        }
        confirmLabel="Xóa"
        onConfirm={async () => {
          if (deleteTarget) await handleDelete(deleteTarget.id);
        }}
      />
    </div>
  );
}
