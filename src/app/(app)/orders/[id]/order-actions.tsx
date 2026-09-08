"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveOrder,
  rejectOrder,
  deliverOrder,
} from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X, Truck, Loader2 } from "lucide-react";

export function OrderActions({
  orderId,
  canApprove,
  canDeliver,
}: {
  orderId: number;
  canApprove: boolean;
  canDeliver: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  async function run(
    key: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    successMsg: string
  ) {
    setLoading(key);
    const res = await fn();
    setLoading(null);
    if (!res.ok) {
      toast.error("Thất bại", { description: res.error });
      return;
    }
    toast.success(successMsg);
    setRejecting(false);
    setReason("");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {canApprove && (
        <>
          <Button
            className="w-full"
            disabled={loading !== null}
            onClick={() =>
              run(
                "approve",
                () => approveOrder(orderId),
                "Đã duyệt đơn — số liệu đã phân bổ vào bảng tổng hợp."
              )
            }
          >
            {loading === "approve" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Duyệt đơn
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            disabled={loading !== null}
            onClick={() => setRejecting(true)}
          >
            <X className="size-4" /> Từ chối
          </Button>

          <Dialog open={rejecting} onOpenChange={setRejecting}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Từ chối đơn</DialogTitle>
                <DialogDescription>
                  Nhập lý do từ chối để gửi kèm thông báo cho người tạo đơn.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="reject-reason">Lý do</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Lý do từ chối (không bắt buộc)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejecting(false);
                    setReason("");
                  }}
                  disabled={loading !== null}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  disabled={loading !== null}
                  onClick={() =>
                    run(
                      "reject",
                      () => rejectOrder(orderId, reason),
                      "Đã từ chối đơn."
                    )
                  }
                >
                  {loading === "reject" && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Xác nhận từ chối
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {canDeliver && (
        <Button
          className="w-full"
          disabled={loading !== null}
          onClick={() =>
            run(
              "deliver",
              () => deliverOrder(orderId),
              "Đã đánh dấu giao hàng — công nợ đã cập nhật."
            )
          }
        >
          {loading === "deliver" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Truck className="size-4" />
          )}
          Đánh dấu đã giao
        </Button>
      )}
    </div>
  );
}
