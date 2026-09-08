import { and, eq, gte, lt, sql, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems, materials, user, payments } from "@/lib/db/schema";
import { toNumber } from "@/lib/utils";

/** "YYYY-MM" -> khoảng thời gian [start, end) */
export function monthRange(month?: string): {
  start: Date;
  end: Date;
  label: string;
} {
  let y: number;
  let m: number; // 0-based
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yy, mm] = month.split("-").map(Number);
    y = yy;
    m = mm - 1;
  } else {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth();
  }
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 1);
  return { start, end, label: `${String(m + 1).padStart(2, "0")}/${y}` };
}

export function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export type MaterialCostRow = {
  materialId: number;
  name: string;
  unit: string;
  group: string;
  qty: number;
  amount: number;
};

/** Chi phí vật tư thực tế (đơn đã giao) trong tháng, gộp theo vật tư. */
export async function getMaterialCostStats(opts: {
  start: Date;
  end: Date;
  projectId?: number;
}): Promise<MaterialCostRow[]> {
  const conds = [
    eq(orders.status, "delivered"),
    gte(orders.deliveredAt, opts.start),
    lt(orders.deliveredAt, opts.end),
  ];
  if (opts.projectId) conds.push(eq(orders.projectId, opts.projectId));

  const rows = await db
    .select({
      materialId: materials.id,
      name: materials.name,
      unit: materials.unit,
      group: materials.group,
      qty: sql<string>`coalesce(sum(${orderItems.qty}), 0)`,
      amount: sql<string>`coalesce(sum(${orderItems.amount}), 0)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(materials, eq(orderItems.materialId, materials.id))
    .where(and(...conds))
    .groupBy(materials.id, materials.name, materials.unit, materials.group)
    .orderBy(asc(materials.group), asc(materials.name));

  return rows.map((r) => ({
    materialId: r.materialId,
    name: r.name,
    unit: r.unit,
    group: r.group,
    qty: toNumber(r.qty),
    amount: toNumber(r.amount),
  }));
}

export type SupplierDebtRow = {
  supplierId: string;
  name: string;
  delivered: number;
  paid: number;
  debt: number;
};

/** Công nợ theo cửa hàng (toàn thời gian): tổng đã giao − tổng đã thanh toán. */
export async function getSupplierDebts(): Promise<SupplierDebtRow[]> {
  const suppliers = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.role, "supplier"))
    .orderBy(asc(user.name));

  const deliveredRows = await db
    .select({
      supplierId: orders.supplierId,
      total: sql<string>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(eq(orders.status, "delivered"))
    .groupBy(orders.supplierId);

  const paidRows = await db
    .select({
      supplierId: payments.supplierId,
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .groupBy(payments.supplierId);

  const deliveredMap = new Map<string, number>();
  for (const d of deliveredRows) {
    if (d.supplierId) deliveredMap.set(d.supplierId, toNumber(d.total));
  }
  const paidMap = new Map<string, number>();
  for (const p of paidRows) paidMap.set(p.supplierId, toNumber(p.total));

  return suppliers.map((s) => {
    const delivered = deliveredMap.get(s.id) ?? 0;
    const paid = paidMap.get(s.id) ?? 0;
    return {
      supplierId: s.id,
      name: s.name,
      delivered,
      paid,
      debt: delivered - paid,
    };
  });
}
