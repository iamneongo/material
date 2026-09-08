import Link from "next/link";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, projects, materials, payments } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { OrderStatusBadge } from "@/components/order-status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatVND, formatDateTime } from "@/lib/utils";
import { ROLE_LABELS, ORDER_STATUS_LABELS } from "@/lib/constants";
import { DashboardChart } from "./dashboard-chart";
import {
  Building2,
  ClipboardList,
  CheckSquare,
  Truck,
  Wallet,
  PackagePlus,
  ArrowRight,
} from "lucide-react";

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function DashboardPage() {
  const user = await requireUser();
  const monthStart = startOfMonth();

  const [
    [projectCount],
    [pendingCount],
    [approvedCount],
    [deliveredMonth],
    [materialCount],
  ] = await Promise.all([
    db.select({ v: count() }).from(projects),
    db
      .select({ v: count() })
      .from(orders)
      .where(eq(orders.status, "pending")),
    db
      .select({ v: count() })
      .from(orders)
      .where(eq(orders.status, "approved")),
    db
      .select({ v: sql<string>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(
        and(eq(orders.status, "delivered"), gte(orders.deliveredAt, monthStart))
      ),
    db.select({ v: count() }).from(materials),
  ]);

  // Công nợ toàn hệ thống (đã giao − đã thanh toán)
  const [deliveredTotal] = await db
    .select({ v: sql<string>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(eq(orders.status, "delivered"));
  const [paidTotal] = await db
    .select({ v: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments);
  const debt = Number(deliveredTotal.v) - Number(paidTotal.v);

  const recentOrders = await db.query.orders.findMany({
    with: { project: true, createdBy: true },
    orderBy: [desc(orders.createdAt)],
    limit: 6,
  });

  // Đếm đơn theo trạng thái (cho biểu đồ)
  const statusRows = await db
    .select({ status: orders.status, v: count() })
    .from(orders)
    .groupBy(orders.status);
  const statusMap = new Map(statusRows.map((r) => [r.status, r.v]));
  const chartData = (["pending", "approved", "delivered", "rejected"] as const).map(
    (s) => ({ name: ORDER_STATUS_LABELS[s], value: statusMap.get(s) ?? 0 })
  );

  const stats = [
    {
      label: "Công trình",
      value: projectCount.v,
      icon: Building2,
      href: user.role === "admin" ? "/admin/projects" : "/reconcile",
    },
    {
      label: "Đơn chờ duyệt",
      value: pendingCount.v,
      icon: CheckSquare,
      href: user.role === "director" ? "/approvals" : "/orders",
    },
    {
      label: "Đơn cần giao",
      value: approvedCount.v,
      icon: Truck,
      href: user.role === "supplier" ? "/delivery" : "/orders",
    },
    {
      label: "Vật tư",
      value: materialCount.v,
      icon: ClipboardList,
      href: user.role === "admin" ? "/admin/materials" : "/reconcile",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Xin chào, ${user.name}`}
        description={`Bảng điều khiển ${ROLE_LABELS[user.role]}`}
        action={<QuickAction role={user.role} />}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-3 py-1">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold tabular-nums">
                      {s.value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Money cards */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đã giao trong tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">
              {formatVND(deliveredMonth.v)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Công nợ cửa hàng (toàn hệ thống)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-semibold",
                debt > 0 ? "text-red-600" : "text-emerald-600"
              )}
            >
              {formatVND(debt)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
      {/* Status chart */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Đơn theo trạng thái</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardChart data={chartData} />
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Đơn đặt gần đây</CardTitle>
          <Link
            href="/orders"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có đơn nào.
            </p>
          ) : (
            <div className="divide-y">
              {recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{o.code}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {o.project?.name} · {o.createdBy?.name} ·{" "}
                      {formatDateTime(o.createdAt)}
                    </div>
                  </div>
                  <div className="shrink-0 font-medium tabular-nums">
                    {formatVND(o.total)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function QuickAction({ role }: { role: string }) {
  if (role === "site")
    return (
      <Link href="/orders/new" className={cn(buttonVariants({ size: "lg" }))}>
        <PackagePlus className="size-4" /> Đặt vật tư
      </Link>
    );
  if (role === "director")
    return (
      <Link href="/approvals" className={cn(buttonVariants({ size: "lg" }))}>
        <CheckSquare className="size-4" /> Duyệt đơn
      </Link>
    );
  if (role === "supplier")
    return (
      <Link href="/delivery" className={cn(buttonVariants({ size: "lg" }))}>
        <Truck className="size-4" /> Đơn cần giao
      </Link>
    );
  if (role === "admin")
    return (
      <Link href="/reports" className={cn(buttonVariants({ size: "lg" }))}>
        <Wallet className="size-4" /> Thống kê
      </Link>
    );
  return null;
}
