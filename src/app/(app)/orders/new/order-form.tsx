"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SelectField } from "@/components/select-field";
import { formatVND, toNumber } from "@/lib/utils";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import type { ProjectStatus } from "@/lib/db/schema";

type ProjectOpt = {
  id: number;
  name: string;
  code: string;
  status: ProjectStatus;
};
type MaterialOpt = { id: number; name: string; unit: string; group: string };
type SupplierOpt = { id: string; name: string; email: string };

type Row = { key: number; materialId: string; qty: string; unitPrice: string };

const ALL_SUPPLIERS = "all";

export function OrderForm({
  projects,
  materials,
  suppliers,
  suggestedPrices,
}: {
  projects: ProjectOpt[];
  materials: MaterialOpt[];
  suppliers: SupplierOpt[];
  suggestedPrices: Record<number, number>;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [supplierId, setSupplierId] = useState(ALL_SUPPLIERS);
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { key: 1, materialId: "", qty: "", unitPrice: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const materialsById = useMemo(() => {
    const m = new Map<number, MaterialOpt>();
    materials.forEach((x) => m.set(x.id, x));
    return m;
  }, [materials]);

  function addRow() {
    setRows((r) => [
      ...r,
      { key: Date.now(), materialId: "", qty: "", unitPrice: "" },
    ]);
  }

  function removeRow(key: number) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r));
  }

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((r) =>
      r.map((x) => {
        if (x.key !== key) return x;
        const next = { ...x, ...patch };
        // Tự điền đơn giá gợi ý khi chọn vật tư nếu chưa nhập
        if (patch.materialId && !x.unitPrice) {
          const suggested = suggestedPrices[Number(patch.materialId)];
          if (suggested) next.unitPrice = String(suggested);
        }
        return next;
      })
    );
  }

  const total = rows.reduce(
    (s, r) => s + toNumber(r.qty) * toNumber(r.unitPrice),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createOrder({
      projectId: Number(projectId),
      supplierId:
        supplierId && supplierId !== ALL_SUPPLIERS ? supplierId : null,
      note,
      items: rows.map((r) => ({
        materialId: Number(r.materialId),
        qty: toNumber(r.qty),
        unitPrice: toNumber(r.unitPrice),
      })),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Không thể gửi đơn", { description: res.error });
      return;
    }
    toast.success("Đã gửi đơn đặt vật tư", {
      description: "Đã gửi thông báo tới giám đốc và cửa hàng.",
    });
    router.push(res.orderId ? `/orders/${res.orderId}` : "/orders");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Công trình *</Label>
            <SelectField
              value={projectId}
              onChange={setProjectId}
              placeholder="— Chọn công trình —"
              options={projects.map((p) => ({
                value: String(p.id),
                label: `${p.code} · ${p.name} (${PROJECT_STATUS_LABELS[p.status]})`,
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Cửa hàng vật liệu</Label>
            <SelectField
              value={supplierId}
              onChange={setSupplierId}
              options={[
                { value: ALL_SUPPLIERS, label: "Gửi tới tất cả cửa hàng" },
                ...suppliers.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Danh sách vật tư</h3>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="size-4" /> Thêm dòng
            </Button>
          </div>

          {/* Header (desktop) */}
          <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_110px_140px_140px_36px]">
            <div>Vật tư</div>
            <div>Số lượng</div>
            <div>Đơn giá (₫)</div>
            <div className="text-right">Thành tiền</div>
            <div />
          </div>

          <div className="space-y-2">
            {rows.map((row) => {
              const mat = row.materialId
                ? materialsById.get(Number(row.materialId))
                : undefined;
              const amount = toNumber(row.qty) * toNumber(row.unitPrice);
              return (
                <div
                  key={row.key}
                  className="grid gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_110px_140px_140px_36px] sm:items-center sm:border-0 sm:p-0"
                >
                  <SelectField
                    value={row.materialId}
                    onChange={(v) => updateRow(row.key, { materialId: v })}
                    placeholder="— Chọn vật tư —"
                    options={materials.map((m) => ({
                      value: String(m.id),
                      label: `${m.name} (${m.unit}) · ${m.group}`,
                    }))}
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    placeholder={mat ? `SL (${mat.unit})` : "Số lượng"}
                    value={row.qty}
                    onChange={(e) => updateRow(row.key, { qty: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    step="any"
                    min="0"
                    placeholder="Đơn giá"
                    value={row.unitPrice}
                    onChange={(e) =>
                      updateRow(row.key, { unitPrice: e.target.value })
                    }
                    required
                  />
                  <div className="text-right text-sm font-medium tabular-nums">
                    {formatVND(amount)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.key)}
                    aria-label="Xóa dòng"
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Tổng cộng</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatVND(total)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <Label htmlFor="note">Ghi chú</Label>
          <Textarea
            id="note"
            placeholder="Ghi chú thêm cho đơn (không bắt buộc)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/orders")}
        >
          Hủy
        </Button>
        <Button type="submit" size="lg" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Gửi đơn
        </Button>
      </div>
    </form>
  );
}
