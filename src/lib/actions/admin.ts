"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, materials, budgets } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/session";
import { toNumber } from "@/lib/utils";
import { logActivity } from "@/lib/activity";
import type { ProjectStatus } from "@/lib/db/schema";

type Result = { ok: boolean; error?: string };

async function requireAdmin(): Promise<Result | null> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Chưa đăng nhập." };
  if (me.role !== "admin")
    return { ok: false, error: "Chỉ quản trị viên mới được thao tác." };
  return null;
}

/* -------------------------------- Projects ------------------------------- */
export async function createProject(input: {
  code: string;
  name: string;
  address?: string;
  status?: ProjectStatus;
}): Promise<Result> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const me = (await getCurrentUser())!;
  if (!input.code?.trim() || !input.name?.trim())
    return { ok: false, error: "Mã và tên công trình là bắt buộc." };
  try {
    await db.insert(projects).values({
      code: input.code.trim(),
      name: input.name.trim(),
      address: input.address?.trim() || null,
      status: input.status ?? "active",
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Không thể tạo (mã có thể đã tồn tại)." };
  }
  await logActivity(db, {
    actorId: me.id,
    actorName: me.name,
    action: "project.created",
    entityType: "project",
    summary: `${me.name} thêm công trình "${input.name.trim()}" (${input.code.trim()}).`,
  });
  revalidatePath("/admin/projects");
  return { ok: true };
}

export async function updateProject(
  id: number,
  input: { code: string; name: string; address?: string; status: ProjectStatus }
): Promise<Result> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const me = (await getCurrentUser())!;
  try {
    await db
      .update(projects)
      .set({
        code: input.code.trim(),
        name: input.name.trim(),
        address: input.address?.trim() || null,
        status: input.status,
      })
      .where(eq(projects.id, id));
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Không thể cập nhật (mã có thể trùng)." };
  }
  await logActivity(db, {
    actorId: me.id,
    actorName: me.name,
    action: "project.updated",
    entityType: "project",
    entityId: id,
    summary: `${me.name} sửa công trình "${input.name.trim()}" (${input.code.trim()}).`,
  });
  revalidatePath("/admin/projects");
  return { ok: true };
}

export async function deleteProject(id: number): Promise<Result> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const me = (await getCurrentUser())!;
  const [existing] = await db
    .select({ code: projects.code, name: projects.name })
    .from(projects)
    .where(eq(projects.id, id));
  try {
    await db.delete(projects).where(eq(projects.id, id));
  } catch {
    return {
      ok: false,
      error: "Không thể xóa: công trình đang có đơn đặt hàng.",
    };
  }
  await logActivity(db, {
    actorId: me.id,
    actorName: me.name,
    action: "project.deleted",
    entityType: "project",
    summary: `${me.name} xóa công trình "${existing?.name ?? ""}" (${existing?.code ?? id}).`,
  });
  revalidatePath("/admin/projects");
  return { ok: true };
}

/* -------------------------------- Materials ------------------------------ */
export async function createMaterial(input: {
  code: string;
  name: string;
  unit: string;
  group: string;
}): Promise<Result> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const me = (await getCurrentUser())!;
  if (!input.code?.trim() || !input.name?.trim() || !input.unit?.trim())
    return { ok: false, error: "Mã, tên và đơn vị tính là bắt buộc." };
  try {
    await db.insert(materials).values({
      code: input.code.trim(),
      name: input.name.trim(),
      unit: input.unit.trim(),
      group: input.group?.trim() || "Khác",
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Không thể tạo (mã có thể đã tồn tại)." };
  }
  await logActivity(db, {
    actorId: me.id,
    actorName: me.name,
    action: "material.created",
    entityType: "material",
    summary: `${me.name} thêm vật tư "${input.name.trim()}" (${input.code.trim()}).`,
  });
  revalidatePath("/admin/materials");
  return { ok: true };
}

export async function updateMaterial(
  id: number,
  input: { code: string; name: string; unit: string; group: string }
): Promise<Result> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const me = (await getCurrentUser())!;
  try {
    await db
      .update(materials)
      .set({
        code: input.code.trim(),
        name: input.name.trim(),
        unit: input.unit.trim(),
        group: input.group?.trim() || "Khác",
      })
      .where(eq(materials.id, id));
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Không thể cập nhật (mã có thể trùng)." };
  }
  await logActivity(db, {
    actorId: me.id,
    actorName: me.name,
    action: "material.updated",
    entityType: "material",
    entityId: id,
    summary: `${me.name} sửa vật tư "${input.name.trim()}" (${input.code.trim()}).`,
  });
  revalidatePath("/admin/materials");
  return { ok: true };
}

export async function deleteMaterial(id: number): Promise<Result> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const me = (await getCurrentUser())!;
  const [existing] = await db
    .select({ code: materials.code, name: materials.name })
    .from(materials)
    .where(eq(materials.id, id));
  try {
    await db.delete(materials).where(eq(materials.id, id));
  } catch {
    return {
      ok: false,
      error: "Không thể xóa: vật tư đang được sử dụng trong đơn/dự toán.",
    };
  }
  await logActivity(db, {
    actorId: me.id,
    actorName: me.name,
    action: "material.deleted",
    entityType: "material",
    summary: `${me.name} xóa vật tư "${existing?.name ?? ""}" (${existing?.code ?? id}).`,
  });
  revalidatePath("/admin/materials");
  return { ok: true };
}

/* -------------------------------- Budgets -------------------------------- */
export async function upsertBudget(input: {
  projectId: number;
  materialId: number;
  qty: number;
  unitPrice: number;
}): Promise<Result> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const me = (await getCurrentUser())!;
  if (!input.projectId || !input.materialId)
    return { ok: false, error: "Vui lòng chọn công trình và vật tư." };
  try {
    await db
      .insert(budgets)
      .values({
        projectId: input.projectId,
        materialId: input.materialId,
        qty: toNumber(input.qty).toFixed(3),
        unitPrice: toNumber(input.unitPrice).toFixed(2),
      })
      .onConflictDoUpdate({
        target: [budgets.projectId, budgets.materialId],
        set: {
          qty: toNumber(input.qty).toFixed(3),
          unitPrice: toNumber(input.unitPrice).toFixed(2),
        },
      });
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Không thể lưu dự toán." };
  }
  const [proj] = await db
    .select({ name: projects.name })
    .from(projects)
    .where(eq(projects.id, input.projectId));
  const [mat] = await db
    .select({ name: materials.name })
    .from(materials)
    .where(eq(materials.id, input.materialId));
  await logActivity(db, {
    actorId: me.id,
    actorName: me.name,
    action: "budget.upserted",
    entityType: "budget",
    summary: `${me.name} cập nhật dự toán "${mat?.name ?? ""}" cho công trình "${proj?.name ?? ""}".`,
  });
  revalidatePath("/admin/budgets");
  revalidatePath("/reconcile");
  return { ok: true };
}

export async function deleteBudget(id: number): Promise<Result> {
  const guard = await requireAdmin();
  if (guard) return guard;
  const me = (await getCurrentUser())!;
  await db.delete(budgets).where(eq(budgets.id, id));
  await logActivity(db, {
    actorId: me.id,
    actorName: me.name,
    action: "budget.deleted",
    entityType: "budget",
    summary: `${me.name} xóa một dòng dự toán.`,
  });
  revalidatePath("/admin/budgets");
  revalidatePath("/reconcile");
  return { ok: true };
}
