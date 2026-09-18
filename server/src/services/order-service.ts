import { alias } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  activityLog, materials, notifications, orderItems, orders,
  projectMaterialActual, projects, user, type UserRole,
} from "../db/schema.js";
import { toNumber } from "../lib/utils.js";
import { logActivity } from "./activity-service.js";

type CurrentUser = { id: string; name: string; role: UserRole };
type NewOrder = { projectId: number; supplierId?: string | null; note?: string | null; items?: { materialId: number; qty: number; unitPrice: number }[] };

const creator = alias(user, "creator");
const supplier = alias(user, "supplier");

function scopedOrderWhere(me: CurrentUser) {
  if (me.role === "site") return eq(orders.createdById, me.id);
  if (me.role === "supplier") return or(eq(orders.supplierId, me.id), isNull(orders.supplierId));
  return undefined;
}

export async function listOrders(me: CurrentUser) {
  return db.select({
    id: orders.id, code: orders.code, projectName: projects.name,
    creatorName: creator.name, supplierName: supplier.name,
    createdAt: orders.createdAt, status: orders.status, total: orders.total,
  }).from(orders)
    .innerJoin(projects, eq(orders.projectId, projects.id))
    .innerJoin(creator, eq(orders.createdById, creator.id))
    .leftJoin(supplier, eq(orders.supplierId, supplier.id))
    .where(scopedOrderWhere(me)).orderBy(desc(orders.createdAt));
}

export async function getOrder(orderId: number) {
  const [order] = await db.select({
    id: orders.id, code: orders.code, status: orders.status, note: orders.note,
    total: orders.total, createdAt: orders.createdAt, approvedAt: orders.approvedAt,
    deliveredAt: orders.deliveredAt, rejectedReason: orders.rejectedReason,
    projectName: projects.name, creatorName: creator.name, supplierName: supplier.name,
  }).from(orders).innerJoin(projects, eq(orders.projectId, projects.id))
    .innerJoin(creator, eq(orders.createdById, creator.id))
    .leftJoin(supplier, eq(orders.supplierId, supplier.id))
    .where(eq(orders.id, orderId));
  if (!order) return null;
  const [items, timeline] = await Promise.all([
    db.select({ id: orderItems.id, materialId: materials.id, name: materials.name, unit: materials.unit,
      group: materials.group, qty: orderItems.qty, unitPrice: orderItems.unitPrice, amount: orderItems.amount })
      .from(orderItems).innerJoin(materials, eq(orderItems.materialId, materials.id))
      .where(eq(orderItems.orderId, orderId)),
    db.select().from(activityLog).where(and(eq(activityLog.entityType, "order"), eq(activityLog.entityId, orderId)))
      .orderBy(asc(activityLog.createdAt)),
  ]);
  return { ...order, supplierName: order.supplierName ?? "Tất cả cửa hàng", items, timeline };
}

export async function getApprovalOrders() {
  return listActionOrders(eq(orders.status, "pending"), orders.createdAt);
}

export async function getDeliveryOrders(me: CurrentUser) {
  const scope = me.role === "supplier" ? or(eq(orders.supplierId, me.id), isNull(orders.supplierId)) : undefined;
  return listActionOrders(and(eq(orders.status, "approved"), scope), orders.approvedAt);
}

async function listActionOrders(where: ReturnType<typeof eq> | undefined, orderColumn: typeof orders.createdAt | typeof orders.approvedAt) {
  const rows = await db.select({
    id: orders.id, code: orders.code, total: orders.total, note: orders.note,
    createdAt: orders.createdAt, approvedAt: orders.approvedAt,
    projectName: projects.name, creatorName: creator.name,
  }).from(orders).innerJoin(projects, eq(orders.projectId, projects.id))
    .innerJoin(creator, eq(orders.createdById, creator.id)).where(where).orderBy(desc(orderColumn));
  return Promise.all(rows.map(async (row) => ({
    ...row,
    items: await db.select({ id: orderItems.id, name: materials.name, unit: materials.unit, qty: orderItems.qty, amount: orderItems.amount })
      .from(orderItems).innerJoin(materials, eq(orderItems.materialId, materials.id)).where(eq(orderItems.orderId, row.id)),
  })));
}

export async function createOrder(me: CurrentUser, input: NewOrder) {
  if (me.role !== "site" && me.role !== "admin") throw new Error("Chỉ đội thi công mới được tạo đơn.");
  const items = (input.items ?? []).filter((item) => item.materialId && toNumber(item.qty) > 0);
  if (!input.projectId) throw new Error("Vui lòng chọn công trình.");
  if (!items.length) throw new Error("Đơn phải có ít nhất một dòng vật tư hợp lệ.");
  const total = items.reduce((sum, item) => sum + toNumber(item.qty) * toNumber(item.unitPrice), 0);
  let newOrderId = 0;
  await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(orders).values({ code: "TMP", projectId: input.projectId,
      supplierId: input.supplierId || null, createdById: me.id, status: "pending", note: input.note || null,
      total: total.toFixed(2) }).returning({ id: orders.id });
    newOrderId = inserted.id;
    const code = `DH${String(inserted.id).padStart(5, "0")}`;
    await tx.update(orders).set({ code }).where(eq(orders.id, inserted.id));
    await tx.insert(orderItems).values(items.map((item) => ({ orderId: inserted.id, materialId: item.materialId,
      qty: toNumber(item.qty).toFixed(3), unitPrice: toNumber(item.unitPrice).toFixed(2),
      amount: (toNumber(item.qty) * toNumber(item.unitPrice)).toFixed(2) })));
    const admins = await tx.select({ id: user.id }).from(user).where(eq(user.role, "admin"));
    const suppliers = input.supplierId ? [{ id: input.supplierId }] : await tx.select({ id: user.id }).from(user).where(eq(user.role, "supplier"));
    const [project] = await tx.select({ name: projects.name }).from(projects).where(eq(projects.id, input.projectId));
    const recipients = Array.from(new Set([...admins, ...suppliers].map((row) => row.id)));
    if (recipients.length) await tx.insert(notifications).values(recipients.map((userId) => ({ userId,
      title: `Đơn đặt vật tư mới ${code}`, message: `${me.name} vừa tạo đơn ${code} cho công trình "${project?.name ?? ""}".`, orderId: inserted.id })));
    await logActivity(tx, { actorId: me.id, actorName: me.name, action: "order.created", entityType: "order", entityId: inserted.id,
      summary: `${me.name} đã tạo đơn ${code} cho công trình "${project?.name ?? ""}" (${total.toLocaleString("vi-VN")} ₫).` });
  });
  return { orderId: newOrderId };
}

export async function approveOrder(me: CurrentUser, orderId: number) {
  if (me.role !== "admin") throw new Error("Chỉ quản trị mới được duyệt đơn.");
  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
    if (!order) throw new Error("Không tìm thấy đơn.");
    if (order.status !== "pending") throw new Error("Đơn không ở trạng thái chờ duyệt.");
    await tx.update(orders).set({ status: "approved", approvedAt: new Date(), approvedById: me.id }).where(eq(orders.id, orderId));
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const item of items) await tx.insert(projectMaterialActual).values({ projectId: order.projectId, materialId: item.materialId,
      qty: item.qty, amount: item.amount, updatedAt: new Date() }).onConflictDoUpdate({
        target: [projectMaterialActual.projectId, projectMaterialActual.materialId],
        set: { qty: sql`${projectMaterialActual.qty} + ${item.qty}`, amount: sql`${projectMaterialActual.amount} + ${item.amount}`, updatedAt: new Date() },
      });
    const suppliers = order.supplierId ? [{ id: order.supplierId }] : await tx.select({ id: user.id }).from(user).where(eq(user.role, "supplier"));
    const recipients = Array.from(new Set([order.createdById, ...suppliers.map((row) => row.id)]));
    await tx.insert(notifications).values(recipients.map((userId) => ({ userId, title: `Đơn ${order.code} đã được duyệt`,
      message: userId === order.createdById ? `Đơn ${order.code} của bạn đã được duyệt.` : `Đơn ${order.code} đã được duyệt, vui lòng chuẩn bị giao hàng.`, orderId })));
    await logActivity(tx, { actorId: me.id, actorName: me.name, action: "order.approved", entityType: "order", entityId: orderId,
      summary: `${me.name} đã duyệt đơn ${order.code}. Số liệu được phân bổ vào bảng tổng hợp thực tế.` });
  });
}

export async function rejectOrder(me: CurrentUser, orderId: number, reason: string) {
  if (me.role !== "admin") throw new Error("Chỉ quản trị mới được từ chối đơn.");
  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
    if (!order) throw new Error("Không tìm thấy đơn.");
    if (order.status !== "pending") throw new Error("Đơn không ở trạng thái chờ duyệt.");
    await tx.update(orders).set({ status: "rejected", rejectedReason: reason || null, approvedById: me.id, approvedAt: new Date() }).where(eq(orders.id, orderId));
    await tx.insert(notifications).values({ userId: order.createdById, title: `Đơn ${order.code} bị từ chối`,
      message: `Đơn ${order.code} đã bị từ chối${reason ? `: ${reason}` : "."}`, orderId });
    await logActivity(tx, { actorId: me.id, actorName: me.name, action: "order.rejected", entityType: "order", entityId: orderId,
      summary: `${me.name} đã từ chối đơn ${order.code}${reason ? `: ${reason}` : "."}` });
  });
}

export async function deliverOrder(me: CurrentUser, orderId: number) {
  if (!(["supplier", "admin"] as UserRole[]).includes(me.role)) throw new Error("Chỉ cửa hàng mới được đánh dấu đã giao.");
  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
    if (!order) throw new Error("Không tìm thấy đơn.");
    if (order.status !== "approved") throw new Error("Đơn chưa được duyệt hoặc đã giao.");
    await tx.update(orders).set({ status: "delivered", deliveredAt: new Date() }).where(eq(orders.id, orderId));
    const admins = await tx.select({ id: user.id }).from(user).where(eq(user.role, "admin"));
    const recipients = Array.from(new Set([order.createdById, ...admins.map((row) => row.id)]));
    await tx.insert(notifications).values(recipients.map((userId) => ({ userId, title: `Đơn ${order.code} đã giao`, message: `Đơn ${order.code} đã được cửa hàng giao hàng.`, orderId })));
    await logActivity(tx, { actorId: me.id, actorName: me.name, action: "order.delivered", entityType: "order", entityId: orderId, summary: `${me.name} đã giao đơn ${order.code}.` });
  });
}

export async function markNotificationsRead(me: CurrentUser, ids?: number[]) {
  const conditions = [eq(notifications.userId, me.id), eq(notifications.isRead, false)];
  if (ids?.length) conditions.push(inArray(notifications.id, ids));
  await db.update(notifications).set({ isRead: true }).where(and(...conditions));
}
