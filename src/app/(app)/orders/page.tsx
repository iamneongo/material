import Link from "next/link";
import { desc, eq, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PackagePlus } from "lucide-react";
import { OrdersTable, type OrderRow } from "./orders-table";

export default async function OrdersPage() {
  const user = await requireUser();

  const whereClause =
    user.role === "site"
      ? eq(orders.createdById, user.id)
      : user.role === "supplier"
        ? or(eq(orders.supplierId, user.id), isNull(orders.supplierId))
        : undefined;

  const list = await db.query.orders.findMany({
    where: whereClause,
    with: { project: true, createdBy: true, supplier: true },
    orderBy: [desc(orders.createdAt)],
  });

  const rows: OrderRow[] = list.map((o) => ({
    id: o.id,
    code: o.code,
    projectName: o.project?.name ?? "",
    creatorName: o.createdBy?.name ?? "",
    supplierName: o.supplier?.name ?? "Tất cả cửa hàng",
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    total: Number(o.total),
  }));

  return (
    <div>
      <PageHeader
        title={user.role === "site" ? "Đơn của tôi" : "Đơn đặt vật tư"}
        description="Danh sách đơn đặt vật tư và trạng thái xử lý."
        action={
          user.role === "site" || user.role === "admin" ? (
            <Link
              href="/orders/new"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              <PackagePlus className="size-4" /> Đặt vật tư
            </Link>
          ) : undefined
        }
      />

      <OrdersTable rows={rows} />
    </div>
  );
}
