import { alias } from "drizzle-orm/pg-core";
import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { budgets, materials, orderItems, orders, payments, projectMaterialActual, projectSupplierContacts, projects, supplierContacts, user } from "../db/schema.js";
import { monthRange, toNumber } from "../lib/utils.js";
import { logActivity } from "./activity-service.js";

export async function materialCosts(month?: string, projectId?: number) {
  const range = monthRange(month);
  const conditions = [eq(orders.status, "delivered"), gte(orders.deliveredAt, range.start), lt(orders.deliveredAt, range.end)];
  if (projectId) conditions.push(eq(orders.projectId, projectId));
  const rows = await db.select({ materialId: materials.id, name: materials.name, unit: materials.unit, group: materials.group,
    qty: sql<string>`coalesce(sum(${orderItems.qty}), 0)`, amount: sql<string>`coalesce(sum(${orderItems.amount}), 0)` })
    .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).innerJoin(materials, eq(orderItems.materialId, materials.id))
    .where(and(...conditions)).groupBy(materials.id, materials.name, materials.unit, materials.group).orderBy(asc(materials.group), asc(materials.name));
  return { range, rows: rows.map((row) => ({ ...row, qty: toNumber(row.qty), amount: toNumber(row.amount) })) };
}

export async function supplierDebts() {
  const suppliers = await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.role, "supplier")).orderBy(asc(user.name));
  const [delivered, paid] = await Promise.all([
    db.select({ supplierId: orders.supplierId, total: sql<string>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(eq(orders.status, "delivered")).groupBy(orders.supplierId),
    db.select({ supplierId: payments.supplierId, total: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments).groupBy(payments.supplierId),
  ]);
  const deliveredMap = new Map(delivered.filter((row) => row.supplierId).map((row) => [row.supplierId!, toNumber(row.total)]));
  const paidMap = new Map(paid.map((row) => [row.supplierId, toNumber(row.total)]));
  return suppliers.map((supplier) => ({ supplierId: supplier.id, name: supplier.name,
    delivered: deliveredMap.get(supplier.id) ?? 0, paid: paidMap.get(supplier.id) ?? 0,
    debt: (deliveredMap.get(supplier.id) ?? 0) - (paidMap.get(supplier.id) ?? 0) }));
}

export async function getReport(month?: string, projectId?: number) {
  const [{ range, rows }, debts, projectRows] = await Promise.all([
    materialCosts(month, projectId), supplierDebts(),
    db.select({ id: projects.id, name: projects.name, code: projects.code }).from(projects).orderBy(asc(projects.name)),
  ]);
  const groups = new Map<string, number>();
  for (const row of rows) groups.set(row.group, (groups.get(row.group) ?? 0) + row.amount);
  return { month: range.value, label: range.label, projects: projectRows, materialStats: rows, debts,
    totalCost: rows.reduce((sum, row) => sum + row.amount, 0), totalDebt: debts.reduce((sum, row) => sum + row.debt, 0),
    groupData: Array.from(groups, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) };
}

export async function getReconcile(projectId?: number) {
  const projectRows = await db.select({ id: projects.id, name: projects.name, code: projects.code }).from(projects).orderBy(asc(projects.name));
  const selectedId = projectId || projectRows[0]?.id;
  if (!selectedId) return { projects: [], selectedId: null, rows: [], totalBudget: 0, totalActual: 0, totalDiff: 0 };
  const [budgetRows, actualRows] = await Promise.all([
    db.select({ materialId: budgets.materialId, name: materials.name, unit: materials.unit, group: materials.group, qty: budgets.qty, unitPrice: budgets.unitPrice })
      .from(budgets).innerJoin(materials, eq(budgets.materialId, materials.id)).where(eq(budgets.projectId, selectedId)),
    db.select({ materialId: projectMaterialActual.materialId, name: materials.name, unit: materials.unit, group: materials.group,
      qty: projectMaterialActual.qty, amount: projectMaterialActual.amount }).from(projectMaterialActual)
      .innerJoin(materials, eq(projectMaterialActual.materialId, materials.id)).where(eq(projectMaterialActual.projectId, selectedId)),
  ]);
  const map = new Map<number, { materialId: number; name: string; unit: string; group: string; budgetQty: number; budgetAmount: number; actualQty: number; actualAmount: number }>();
  for (const row of budgetRows) map.set(row.materialId, { materialId: row.materialId, name: row.name, unit: row.unit, group: row.group,
    budgetQty: toNumber(row.qty), budgetAmount: toNumber(row.qty) * toNumber(row.unitPrice), actualQty: 0, actualAmount: 0 });
  for (const row of actualRows) {
    const current = map.get(row.materialId);
    if (current) { current.actualQty = toNumber(row.qty); current.actualAmount = toNumber(row.amount); }
    else map.set(row.materialId, { materialId: row.materialId, name: row.name, unit: row.unit, group: row.group,
      budgetQty: 0, budgetAmount: 0, actualQty: toNumber(row.qty), actualAmount: toNumber(row.amount) });
  }
  const rows = Array.from(map.values()).sort((a, b) => a.group === b.group ? a.name.localeCompare(b.name) : a.group.localeCompare(b.group));
  const totalBudget = rows.reduce((sum, row) => sum + row.budgetAmount, 0);
  const totalActual = rows.reduce((sum, row) => sum + row.actualAmount, 0);
  return { projects: projectRows, selectedId, rows, totalBudget, totalActual, totalDiff: totalActual - totalBudget };
}

export async function getProjectSummary(projectId: number) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) throw new Error("Không tìm thấy công trình.");
  const [reconcile, statusRows, recentOrders, linked] = await Promise.all([
    getReconcile(projectId),
    db.select({ status: orders.status, value: count() }).from(orders).where(eq(orders.projectId, projectId)).groupBy(orders.status),
    db.select({ id: orders.id, code: orders.code, status: orders.status, total: orders.total, createdAt: orders.createdAt }).from(orders).where(eq(orders.projectId, projectId)).orderBy(desc(orders.createdAt)).limit(8),
    db.select({ id: supplierContacts.id, name: supplierContacts.name, phone: supplierContacts.phone }).from(projectSupplierContacts).innerJoin(supplierContacts, eq(projectSupplierContacts.supplierContactId, supplierContacts.id)).where(eq(projectSupplierContacts.projectId, projectId)),
  ]);
  const defaultSupplier = linked.find((item) => item.id === project.defaultSupplierContactId) ?? null;
  return { project, totalBudget: reconcile.totalBudget, totalActual: reconcile.totalActual, totalDiff: reconcile.totalDiff, statusRows, recentOrders: recentOrders.map((row) => ({ ...row, total: toNumber(row.total) })), suppliers: linked, defaultSupplier,
    neededMaterials: reconcile.rows.filter((row) => row.budgetQty > row.actualQty).map((row) => ({ ...row, remainingQty: row.budgetQty - row.actualQty })) };
}

export async function getDashboard() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [[projectCount], [pendingCount], [approvedCount], [deliveredMonth], [materialCount], [deliveredTotal], [paidTotal], statusRows] = await Promise.all([
    db.select({ value: count() }).from(projects), db.select({ value: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ value: count() }).from(orders).where(eq(orders.status, "approved")),
    db.select({ value: sql<string>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(and(eq(orders.status, "delivered"), gte(orders.deliveredAt, monthStart))),
    db.select({ value: count() }).from(materials), db.select({ value: sql<string>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(eq(orders.status, "delivered")),
    db.select({ value: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments),
    db.select({ status: orders.status, value: count() }).from(orders).groupBy(orders.status),
  ]);
  const createdBy = alias(user, "dashboard_creator");
  const recentOrders = await db.select({ id: orders.id, code: orders.code, status: orders.status, total: orders.total,
    createdAt: orders.createdAt, projectName: projects.name, creatorName: createdBy.name }).from(orders)
    .innerJoin(projects, eq(orders.projectId, projects.id)).innerJoin(createdBy, eq(orders.createdById, createdBy.id))
    .orderBy(desc(orders.createdAt)).limit(6);
  return { projectCount: projectCount.value, pendingCount: pendingCount.value, approvedCount: approvedCount.value,
    materialCount: materialCount.value, deliveredMonth: toNumber(deliveredMonth.value),
    debt: toNumber(deliveredTotal.value) - toNumber(paidTotal.value), statusRows, recentOrders };
}

export async function addPayment(actor: { id: string; name: string }, input: { supplierId: string; amount: number; note?: string }) {
  if (!input.supplierId) throw new Error("Thiếu cửa hàng.");
  if (toNumber(input.amount) <= 0) throw new Error("Số tiền phải lớn hơn 0.");
  await db.insert(payments).values({ supplierId: input.supplierId, amount: toNumber(input.amount).toFixed(2), note: input.note?.trim() || null, createdById: actor.id });
  const [supplier] = await db.select({ name: user.name }).from(user).where(eq(user.id, input.supplierId));
  await logActivity(db, { actorId: actor.id, actorName: actor.name, action: "payment.added", entityType: "payment",
    summary: `${actor.name} ghi nhận thanh toán ${toNumber(input.amount).toLocaleString("vi-VN")} ₫ cho ${supplier?.name ?? "cửa hàng"}.` });
}

function csvCell(value: string | number) { const text = String(value ?? ""); return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
export async function exportReport(month?: string, projectId?: number) {
  const report = await getReport(month, projectId);
  const lines = [`Thống kê chi phí vật tư - Tháng ${report.label}`, "", ["Vật tư", "Nhóm", "Số lượng", "Đơn vị", "Thành tiền (VND)"].map(csvCell).join(",")];
  for (const row of report.materialStats) lines.push([row.name, row.group, row.qty, row.unit, Math.round(row.amount)].map(csvCell).join(","));
  lines.push(["Tổng chi phí", "", "", "", Math.round(report.totalCost)].map(csvCell).join(","), "", "Công nợ theo cửa hàng (toàn thời gian)",
    ["Cửa hàng", "Đã giao (VND)", "Đã thanh toán (VND)", "Còn nợ (VND)"].map(csvCell).join(","));
  for (const row of report.debts) lines.push([row.name, Math.round(row.delivered), Math.round(row.paid), Math.round(row.debt)].map(csvCell).join(","));
  return { csv: "﻿" + lines.join("\r\n"), filename: `thong-ke-${report.label.replace("/", "-")}.csv` };
}
