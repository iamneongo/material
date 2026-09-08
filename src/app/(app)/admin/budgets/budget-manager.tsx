"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertBudget, deleteBudget } from "@/lib/actions/admin";
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
import { formatVND, formatNumber, toNumber } from "@/lib/utils";
import { SelectField } from "@/components/select-field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

type MaterialOpt = { id: number; name: string; unit: string; group: string };
export type BudgetRow = {
  id: number;
  materialId: number;
  name: string;
  unit: string;
  group: string;
  qty: string;
  unitPrice: string;
};

export function BudgetManager({
  projectId,
  materials,
  rows,
}: {
  projectId: number;
  materials: MaterialOpt[];
  rows: BudgetRow[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nc, setNc] = useState({ materialId: "", qty: "", unitPrice: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [ec, setEc] = useState({ qty: "", unitPrice: "" });
  const [deleteTarget, setDeleteTarget] = useState<BudgetRow | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await upsertBudget({
      projectId,
      materialId: Number(nc.materialId),
      qty: toNumber(nc.qty),
      unitPrice: toNumber(nc.unitPrice),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Lỗi", { description: res.error });
    toast.success("Đã lưu dự toán");
    setNc({ materialId: "", qty: "", unitPrice: "" });
    router.refresh();
  }

  async function handleSave(materialId: number) {
    setLoading(true);
    const res = await upsertBudget({
      projectId,
      materialId,
      qty: toNumber(ec.qty),
      unitPrice: toNumber(ec.unitPrice),
    });
    setLoading(false);
    if (!res.ok) return toast.error("Lỗi", { description: res.error });
    toast.success("Đã cập nhật");
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: number) {
    setLoading(true);
    const res = await deleteBudget(id);
    setLoading(false);
    if (!res.ok) return toast.error("Lỗi", { description: res.error });
    toast.success("Đã xóa dòng dự toán");
    router.refresh();
  }

  const total = rows.reduce(
    (s, r) => s + toNumber(r.qty) * toNumber(r.unitPrice),
    0
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Thêm / cập nhật dòng dự toán</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAdd}
            className="grid gap-2 sm:grid-cols-[1fr_130px_160px_auto]"
          >
            <SelectField
              value={nc.materialId}
              onChange={(v) => setNc({ ...nc, materialId: v })}
              placeholder="— Chọn vật tư —"
              options={materials.map((m) => ({
                value: String(m.id),
                label: `${m.name} (${m.unit}) · ${m.group}`,
              }))}
            />
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="Số lượng"
              value={nc.qty}
              onChange={(e) => setNc({ ...nc, qty: e.target.value })}
              required
            />
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="Đơn giá"
              value={nc.unitPrice}
              onChange={(e) => setNc({ ...nc, unitPrice: e.target.value })}
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Lưu
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Nếu vật tư đã có trong dự toán, số liệu sẽ được cập nhật.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chưa có dòng dự toán nào cho công trình này.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vật tư</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) =>
                  editingId === r.id ? (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.name}{" "}
                        <span className="text-muted-foreground">({r.unit})</span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          className="text-right"
                          value={ec.qty}
                          onChange={(e) => setEc({ ...ec, qty: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          className="text-right"
                          value={ec.unitPrice}
                          onChange={(e) =>
                            setEc({ ...ec, unitPrice: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatVND(toNumber(ec.qty) * toNumber(ec.unitPrice))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon-sm"
                            onClick={() => handleSave(r.materialId)}
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
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.name}{" "}
                        <span className="text-muted-foreground">({r.unit})</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(r.qty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatVND(r.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatVND(toNumber(r.qty) * toNumber(r.unitPrice))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(r.id);
                              setEc({ qty: r.qty, unitPrice: r.unitPrice });
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(r)}
                            disabled={loading}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Tổng dự toán
                  </TableCell>
                  <TableCell className="text-right text-base font-semibold tabular-nums">
                    {formatVND(total)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Xóa dòng dự toán?"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xóa dự toán "${deleteTarget.name}"?`
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
