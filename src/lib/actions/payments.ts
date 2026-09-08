"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, user } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";
import { toNumber } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

type Result = { ok: boolean; error?: string };

/** Ghi nhận một khoản thanh toán cho cửa hàng (giảm công nợ). */
export async function addPayment(input: {
  supplierId: string;
  amount: number;
  note?: string;
}): Promise<Result> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Chưa đăng nhập." };
  if (me.role !== "admin" && me.role !== "director") {
    return {
      ok: false,
      error: "Chỉ giám đốc/quản trị mới được ghi nhận thanh toán.",
    };
  }
  if (!input.supplierId) return { ok: false, error: "Thiếu cửa hàng." };
  if (toNumber(input.amount) <= 0)
    return { ok: false, error: "Số tiền phải lớn hơn 0." };

  await db.insert(payments).values({
    supplierId: input.supplierId,
    amount: toNumber(input.amount).toFixed(2),
    note: input.note?.trim() || null,
    createdById: me.id,
  });

  const [supplier] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, input.supplierId));

  await logActivity(db, {
    actorId: me.id,
    actorName: me.name,
    action: "payment.added",
    entityType: "payment",
    summary: `${me.name} ghi nhận thanh toán ${toNumber(input.amount).toLocaleString("vi-VN")} ₫ cho ${supplier?.name ?? "cửa hàng"}.`,
  });

  revalidatePath("/reports");
  return { ok: true };
}
