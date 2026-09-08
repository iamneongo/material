import Link from "next/link";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderActions } from "../orders/[id]/order-actions";
import { formatVND, formatNumber, formatDateTime } from "@/lib/utils";

export default async function DeliveryPage() {
  const user = await requireRole(["supplier", "admin"]);

  const approved = await db.query.orders.findMany({
    where: and(
      eq(orders.status, "approved"),
      user.role === "supplier"
        ? or(eq(orders.supplierId, user.id), isNull(orders.supplierId))
        : undefined
    ),
    with: {
      project: true,
      createdBy: true,
      items: { with: { material: true } },
    },
    orderBy: [desc(orders.approvedAt)],
  });

  return (
    <div>
      <PageHeader
        title="Đơn cần giao"
        description={`${approved.length} đơn đã duyệt, chờ giao hàng.`}
      />

      {approved.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Không có đơn nào cần giao.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {approved.map((o) => (
            <Card key={o.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      <Link
                        href={`/orders/${o.id}`}
                        className="hover:underline"
                      >
                        {o.code}
                      </Link>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {o.project?.name} · {o.createdBy?.name} · duyệt{" "}
                      {formatDateTime(o.approvedAt)}
                    </p>
                  </div>
                  <div className="text-lg font-semibold tabular-nums">
                    {formatVND(o.total)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1 text-sm">
                  {o.items.map((it) => (
                    <li
                      key={it.id}
                      className="flex justify-between gap-2 border-b py-1 last:border-0"
                    >
                      <span>
                        {it.material?.name}{" "}
                        <span className="text-muted-foreground">
                          × {formatNumber(it.qty)} {it.material?.unit}
                        </span>
                      </span>
                      <span className="tabular-nums">{formatVND(it.amount)}</span>
                    </li>
                  ))}
                </ul>
                <div className="max-w-sm">
                  <OrderActions orderId={o.id} canApprove={false} canDeliver />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
