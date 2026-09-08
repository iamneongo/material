import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderActions } from "../orders/[id]/order-actions";
import { formatVND, formatNumber, formatDateTime } from "@/lib/utils";

export default async function ApprovalsPage() {
  await requireRole(["director", "admin"]);

  const pending = await db.query.orders.findMany({
    where: eq(orders.status, "pending"),
    with: {
      project: true,
      createdBy: true,
      items: { with: { material: true } },
    },
    orderBy: [desc(orders.createdAt)],
  });

  return (
    <div>
      <PageHeader
        title="Duyệt đơn đặt vật tư"
        description={`${pending.length} đơn đang chờ duyệt.`}
      />

      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Không có đơn nào chờ duyệt.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((o) => (
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
                      {o.project?.name} · {o.createdBy?.name} ·{" "}
                      {formatDateTime(o.createdAt)}
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
                {o.note && (
                  <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                    Ghi chú: {o.note}
                  </p>
                )}
                <div className="max-w-sm">
                  <OrderActions orderId={o.id} canApprove canDeliver={false} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
