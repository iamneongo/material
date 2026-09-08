"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPayment } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/select-field";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AddPaymentForm({
  suppliers,
}: {
  suppliers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await addPayment({
      supplierId,
      amount: Number(amount),
      note,
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Không thể ghi nhận", { description: res.error });
      return;
    }
    toast.success("Đã ghi nhận thanh toán");
    setAmount("");
    setNote("");
    router.refresh();
  }

  if (suppliers.length === 0) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 border-t pt-3"
    >
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Cửa hàng</label>
        <SelectField
          value={supplierId}
          onChange={setSupplierId}
          className="w-56"
          placeholder="Chọn cửa hàng"
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Số tiền (₫)</label>
        <Input
          type="number"
          min="0"
          step="any"
          className="w-40"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          required
        />
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs text-muted-foreground">Ghi chú</label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Không bắt buộc"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Ghi nhận thanh toán
      </Button>
    </form>
  );
}
