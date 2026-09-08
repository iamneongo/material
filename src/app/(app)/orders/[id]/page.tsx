import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, activityLog } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatVND, formatNumber, formatDateTime } from "@/lib/utils";
import { OrderActions } from "./order-actions";
import { OrderTimeline } from "@/components/order-timeline";
import { ArrowLeft } from "lucide-react";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  const user = await requireUser();

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      project: true,
      createdBy: true,
      supplier: true,
      items: { with: { material: true } },
    },
  });

  if (!order) notFound();

  const timeline = await db
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.entityType, "order"),
        eq(activityLog.entityId, orderId)
      )
    )
    .orderBy(asc(activityLog.createdAt));

  const canApprove =
    (user.role === "director" || user.role === "admin") &&
    order.status === "pending";
  const canDeliver =
    (user.role === "supplier" || user.role === "admin") &&
    order.status === "approved";

  return (
    <div>
      <Link
        href="/orders"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Danh sách đơn
      </Link>

      <PageHeader
        title={`Đơn ${order.code}`}
        description={order.project?.name}
        action={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Chi tiết vật tư</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vật tư</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>
                        <div className="font-medium">{it.material?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {it.material?.group}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(it.qty)} {it.material?.unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatVND(it.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatVND(it.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Tổng cộng
                    </TableCell>
                    <TableCell className="text-right text-base font-semibold tabular-nums">
                      {formatVND(order.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {order.note && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ghi chú</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {order.note}
              </CardContent>
            </Card>
          )}

          {order.status === "rejected" && order.rejectedReason && (
            <Card className="border-destructive/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-destructive">
                  Lý do từ chối
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {order.rejectedReason}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Diễn biến đơn</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                events={timeline.map((e) => ({
                  id: e.id,
                  action: e.action,
                  actorName: e.actorName,
                  summary: e.summary,
                  createdAt: e.createdAt.toISOString(),
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoRow label="Công trình" value={order.project?.name} />
              <InfoRow label="Người tạo" value={order.createdBy?.name} />
              <InfoRow
                label="Cửa hàng"
                value={order.supplier?.name ?? "Tất cả cửa hàng"}
              />
              <InfoRow label="Ngày tạo" value={formatDateTime(order.createdAt)} />
              {order.approvedAt && (
                <InfoRow
                  label="Ngày duyệt"
                  value={formatDateTime(order.approvedAt)}
                />
              )}
              {order.deliveredAt && (
                <InfoRow
                  label="Ngày giao"
                  value={formatDateTime(order.deliveredAt)}
                />
              )}
            </CardContent>
          </Card>

          {(canApprove || canDeliver) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Thao tác</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderActions
                  orderId={order.id}
                  canApprove={canApprove}
                  canDeliver={canDeliver}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}
