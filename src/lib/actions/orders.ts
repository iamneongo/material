"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  notifications,
  projectMaterialActual,
  projects,
  user,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";
import { toNumber } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export type ActionResult = { ok: boolean; error?: string; orderId?: number };

async function recipientIdsByRole(
  role: "director" | "supplier"
): Promise<string[]> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, role));
  return rows.map((r) => r.id);
}

type NewOrderInput = {
  projectId: number;
  supplierId?: string | null;
  note?: string | null;
  items: { materialId: number; qty: number; unitPrice: number }[];
};

export async function createOrder(input: NewOrderInput): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Chưa đăng nhập." };
  if (me.role !== "site" && me.role !== "admin") {
    return { ok: false, error: "Chỉ đội thi công mới được tạo đơn." };
  }

  const items = (input.items ?? []).filter(
    (i) => i.materialId && toNumber(i.qty) > 0
  );
  if (!input.projectId) return { ok: false, error: "Vui lòng chọn công trình." };
  if (items.length === 0)
    return { ok: false, error: "Đơn phải có ít nhất một dòng vật tư hợp lệ." };

  const total = items.reduce(
    (s, i) => s + toNumber(i.qty) * toNumber(i.unitPrice),
    0
  );

  let newOrderId = 0;
  try {
    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(orders)
        .values({
          code: "TMP",
          projectId: input.projectId,
          supplierId: input.supplierId || null,
          createdById: me.id,
          status: "pending",
          note: input.note || null,
          total: total.toFixed(2),
        })
        .returning({ id: orders.id });

      newOrderId = inserted.id;
      const code = `DH${String(inserted.id).padStart(5, "0")}`;
      await tx.update(orders).set({ code }).where(eq(orders.id, inserted.id));

      await tx.insert(orderItems).values(
        items.map((i) => ({
          orderId: inserted.id,
          materialId: i.materialId,
          qty: toNumber(i.qty).toFixed(3),
          unitPrice: toNumber(i.unitPrice).toFixed(2),
          amount: (toNumber(i.qty) * toNumber(i.unitPrice)).toFixed(2),
        }))
      );

      // Thông báo cho giám đốc + cửa hàng
      const directorIds = await recipientIdsByRole("director");
      const supplierIds = input.supplierId
        ? [input.supplierId]
        : await recipientIdsByRole("supplier");

      const [proj] = await tx
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, input.projectId));

      const recipients = Array.from(new Set([...directorIds, ...supplierIds]));
      if (recipients.length > 0) {
        await tx.insert(notifications).values(
          recipients.map((uid) => ({
            userId: uid,
            title: `Đơn đặt vật tư mới ${code}`,
            message: `${me.name} vừa tạo đơn ${code} cho công trình "${proj?.name ?? ""}".`,
            orderId: inserted.id,
          }))
        );
      }

      await logActivity(tx, {
        actorId: me.id,
        actorName: me.name,
        action: "order.created",
        entityType: "order",
        entityId: inserted.id,
        summary: `${me.name} đã tạo đơn ${code} cho công trình "${proj?.name ?? ""}" (${total.toLocaleString("vi-VN")} ₫).`,
      });
    });
  } catch (e) {
    console.error("createOrder error", e);
    return { ok: false, error: "Không thể tạo đơn. Vui lòng thử lại." };
  }

  revalidatePath("/orders");
  revalidatePath("/approvals");
  revalidatePath("/");
  return { ok: true, orderId: newOrderId };
}

export async function approveOrder(orderId: number): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Chưa đăng nhập." };
  if (me.role !== "director" && me.role !== "admin") {
    return { ok: false, error: "Chỉ giám đốc mới được duyệt đơn." };
  }

  try {
    await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      if (!order) throw new Error("NOT_FOUND");
      if (order.status !== "pending") throw new Error("INVALID_STATE");

      await tx
        .update(orders)
        .set({
          status: "approved",
          approvedAt: new Date(),
          approvedById: me.id,
        })
        .where(eq(orders.id, orderId));

      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      // Auto phân bổ vào bảng tổng hợp thực tế (project × material)
      for (const it of items) {
        await tx
          .insert(projectMaterialActual)
          .values({
            projectId: order.projectId,
            materialId: it.materialId,
            qty: it.qty,
            amount: it.amount,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [
              projectMaterialActual.projectId,
              projectMaterialActual.materialId,
            ],
            set: {
              qty: sql`${projectMaterialActual.qty} + ${it.qty}`,
              amount: sql`${projectMaterialActual.amount} + ${it.amount}`,
              updatedAt: new Date(),
            },
          });
      }

      // Thông báo cho người tạo + cửa hàng (đơn cần giao)
      const supplierIds = order.supplierId
        ? [order.supplierId]
        : await recipientIdsByRole("supplier");
      const recipients = Array.from(
        new Set([order.createdById, ...supplierIds])
      );
      await tx.insert(notifications).values(
        recipients.map((uid) => ({
          userId: uid,
          title: `Đơn ${order.code} đã được duyệt`,
          message:
            uid === order.createdById
              ? `Đơn ${order.code} của bạn đã được duyệt.`
              : `Đơn ${order.code} đã được duyệt, vui lòng chuẩn bị giao hàng.`,
          orderId: order.id,
        }))
      );

      await logActivity(tx, {
        actorId: me.id,
        actorName: me.name,
        action: "order.approved",
        entityType: "order",
        entityId: order.id,
        summary: `${me.name} đã duyệt đơn ${order.code}. Số liệu được phân bổ vào bảng tổng hợp thực tế.`,
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INVALID_STATE")
      return { ok: false, error: "Đơn không ở trạng thái chờ duyệt." };
    if (msg === "NOT_FOUND")
      return { ok: false, error: "Không tìm thấy đơn." };
    console.error("approveOrder error", e);
    return { ok: false, error: "Không thể duyệt đơn." };
  }

  revalidatePath("/approvals");
  revalidatePath("/orders");
  revalidatePath("/reconcile");
  revalidatePath("/delivery");
  revalidatePath("/");
  return { ok: true };
}

export async function rejectOrder(
  orderId: number,
  reason: string
): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Chưa đăng nhập." };
  if (me.role !== "director" && me.role !== "admin") {
    return { ok: false, error: "Chỉ giám đốc mới được từ chối đơn." };
  }

  try {
    await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      if (!order) throw new Error("NOT_FOUND");
      if (order.status !== "pending") throw new Error("INVALID_STATE");

      await tx
        .update(orders)
        .set({
          status: "rejected",
          rejectedReason: reason || null,
          approvedById: me.id,
          approvedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      await tx.insert(notifications).values({
        userId: order.createdById,
        title: `Đơn ${order.code} bị từ chối`,
        message: `Đơn ${order.code} đã bị từ chối${
          reason ? `: ${reason}` : "."
        }`,
        orderId: order.id,
      });

      await logActivity(tx, {
        actorId: me.id,
        actorName: me.name,
        action: "order.rejected",
        entityType: "order",
        entityId: order.id,
        summary: `${me.name} đã từ chối đơn ${order.code}${
          reason ? `: ${reason}` : "."
        }`,
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INVALID_STATE")
      return { ok: false, error: "Đơn không ở trạng thái chờ duyệt." };
    if (msg === "NOT_FOUND") return { ok: false, error: "Không tìm thấy đơn." };
    console.error("rejectOrder error", e);
    return { ok: false, error: "Không thể từ chối đơn." };
  }

  revalidatePath("/approvals");
  revalidatePath("/orders");
  revalidatePath("/");
  return { ok: true };
}

export async function deliverOrder(orderId: number): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Chưa đăng nhập." };
  if (me.role !== "supplier" && me.role !== "admin") {
    return { ok: false, error: "Chỉ cửa hàng mới được đánh dấu đã giao." };
  }

  try {
    await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));
      if (!order) throw new Error("NOT_FOUND");
      if (order.status !== "approved") throw new Error("INVALID_STATE");

      await tx
        .update(orders)
        .set({ status: "delivered", deliveredAt: new Date() })
        .where(eq(orders.id, orderId));

      const directorIds = await recipientIdsByRole("director");
      const recipients = Array.from(
        new Set([order.createdById, ...directorIds])
      );
      await tx.insert(notifications).values(
        recipients.map((uid) => ({
          userId: uid,
          title: `Đơn ${order.code} đã giao`,
          message: `Đơn ${order.code} đã được cửa hàng giao hàng.`,
          orderId: order.id,
        }))
      );

      await logActivity(tx, {
        actorId: me.id,
        actorName: me.name,
        action: "order.delivered",
        entityType: "order",
        entityId: order.id,
        summary: `${me.name} đã giao đơn ${order.code}.`,
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INVALID_STATE")
      return { ok: false, error: "Đơn chưa được duyệt hoặc đã giao." };
    if (msg === "NOT_FOUND") return { ok: false, error: "Không tìm thấy đơn." };
    console.error("deliverOrder error", e);
    return { ok: false, error: "Không thể cập nhật trạng thái giao." };
  }

  revalidatePath("/delivery");
  revalidatePath("/orders");
  revalidatePath("/reports");
  revalidatePath("/");
  return { ok: true };
}

// Đánh dấu thông báo đã đọc
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Chưa đăng nhập." };
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, me.id),
        eq(notifications.isRead, false)
      )
    );
  revalidatePath("/notifications");
  revalidatePath("/");
  return { ok: true };
}

export async function markNotificationsReadByIds(
  ids: number[]
): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Chưa đăng nhập." };
  if (ids.length === 0) return { ok: true };
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, me.id),
        inArray(notifications.id, ids)
      )
    );
  revalidatePath("/notifications");
  return { ok: true };
}
