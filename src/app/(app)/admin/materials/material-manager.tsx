"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
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
import { MATERIAL_GROUPS, MATERIAL_UNITS } from "@/lib/constants";
import type { Material } from "@/lib/db/schema";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

const UNIT_OPTIONS = MATERIAL_UNITS.map((u) => ({ value: u, label: u }));
const GROUP_OPTIONS = MATERIAL_GROUPS.map((g) => ({ value: g, label: g }));

type Fields = { code: string; name: string; unit: string; group: string };
const empty: Fields = {
  code: "",
  name: "",
  unit: MATERIAL_UNITS[0],
  group: MATERIAL_GROUPS[0],
};

export function MaterialManager({ materials }: { materials: Material[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nc, setNc] = useState<Fields>(empty);
  const [ec, setEc] = useState<Fields>(empty);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createMaterial(nc);
    setLoading(false);
    if (!res.ok) return toast.error("Lỗi", { description: res.error });
    toast.success("Đã thêm vật tư");
    setNc(empty);
    router.refresh();
  }

  async function handleSave(id: number) {
    setLoading(true);
    const res = await updateMaterial(id, ec);
    setLoading(false);
    if (!res.ok) return toast.error("Lỗi", { description: res.error });
    toast.success("Đã cập nhật");
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: number) {
    setLoading(true);
    const res = await deleteMaterial(id);
    setLoading(false);
    if (!res.ok) return toast.error("Không thể xóa", { description: res.error });
    toast.success("Đã xóa vật tư");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Thêm vật tư</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAdd}
            className="grid gap-2 sm:grid-cols-[130px_1fr_130px_150px_auto]"
          >
            <Input
              placeholder="Mã"
              value={nc.code}
              onChange={(e) => setNc({ ...nc, code: e.target.value })}
              required
            />
            <Input
              placeholder="Tên vật tư"
              value={nc.name}
              onChange={(e) => setNc({ ...nc, name: e.target.value })}
              required
            />
            <SelectField
              value={nc.unit}
              onChange={(v) => setNc({ ...nc, unit: v })}
              options={UNIT_OPTIONS}
            />
            <SelectField
              value={nc.group}
              onChange={(v) => setNc({ ...nc, group: v })}
              options={GROUP_OPTIONS}
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
                <TableHead>Đơn vị</TableHead>
                <TableHead>Nhóm</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m) =>
                editingId === m.id ? (
                  <TableRow key={m.id}>
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
                    <TableCell>
                      <SelectField
                        value={ec.unit}
                        onChange={(v) => setEc({ ...ec, unit: v })}
                        options={UNIT_OPTIONS}
                      />
                    </TableCell>
                    <TableCell>
                      <SelectField
                        value={ec.group}
                        onChange={(v) => setEc({ ...ec, group: v })}
                        options={GROUP_OPTIONS}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          onClick={() => handleSave(m.id)}
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
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.code}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.unit}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{m.group}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(m.id);
                            setEc({
                              code: m.code,
                              name: m.name,
                              unit: m.unit,
                              group: m.group,
                            });
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(m)}
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
        title="Xóa vật tư?"
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
