import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, materials, user, budgets } from "@/lib/db/schema";

export async function getActiveProjects() {
  return db
    .select()
    .from(projects)
    .orderBy(asc(projects.name));
}

export async function getMaterials() {
  return db.select().from(materials).orderBy(asc(materials.group), asc(materials.name));
}

export async function getSuppliers() {
  return db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.role, "supplier"))
    .orderBy(asc(user.name));
}

/** Bản đồ đơn giá gợi ý theo vật tư (lấy từ dự toán) để điền nhanh khi đặt. */
export async function getSuggestedPrices(): Promise<Record<number, number>> {
  const rows = await db
    .select({ materialId: budgets.materialId, unitPrice: budgets.unitPrice })
    .from(budgets);
  const map: Record<number, number> = {};
  for (const r of rows) {
    if (map[r.materialId] === undefined) map[r.materialId] = Number(r.unitPrice);
  }
  return map;
}
