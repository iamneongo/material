import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { budgets, materials, projects, user, type ProjectStatus } from "../db/schema.js";
import { toNumber } from "../lib/utils.js";
import { logActivity } from "./activity-service.js";

type Actor = { id: string; name: string };

export async function getOrderOptions() {
  const [projectRows, materialRows, suppliers, priceRows] = await Promise.all([
    db.select().from(projects).orderBy(asc(projects.name)),
    db.select().from(materials).orderBy(asc(materials.group), asc(materials.name)),
    db.select({ id: user.id, name: user.name, email: user.email }).from(user).where(eq(user.role, "supplier")).orderBy(asc(user.name)),
    db.select({ materialId: budgets.materialId, unitPrice: budgets.unitPrice }).from(budgets),
  ]);
  const suggestedPrices: Record<number, number> = {};
  for (const row of priceRows) if (suggestedPrices[row.materialId] === undefined) suggestedPrices[row.materialId] = Number(row.unitPrice);
  return { projects: projectRows, materials: materialRows, suppliers, suggestedPrices };
}

export async function listProjects() { return db.select().from(projects).orderBy(asc(projects.name)); }
export async function listMaterials() { return db.select().from(materials).orderBy(asc(materials.group), asc(materials.name)); }
export async function listSuppliers() { return db.select({ id: user.id, name: user.name, email: user.email }).from(user).where(eq(user.role, "supplier")).orderBy(asc(user.name)); }

export async function createProject(actor: Actor, input: { code: string; name: string; address?: string; status?: ProjectStatus }) {
  if (!input.code?.trim() || !input.name?.trim()) throw new Error("Mã và tên công trình là bắt buộc.");
  await db.insert(projects).values({ code: input.code.trim(), name: input.name.trim(), address: input.address?.trim() || null, status: input.status ?? "active" });
  await logActivity(db, { actorId: actor.id, actorName: actor.name, action: "project.created", entityType: "project", summary: `${actor.name} thêm công trình "${input.name.trim()}" (${input.code.trim()}).` });
}
export async function updateProject(actor: Actor, id: number, input: { code: string; name: string; address?: string; status: ProjectStatus }) {
  await db.update(projects).set({ code: input.code.trim(), name: input.name.trim(), address: input.address?.trim() || null, status: input.status }).where(eq(projects.id, id));
  await logActivity(db, { actorId: actor.id, actorName: actor.name, action: "project.updated", entityType: "project", entityId: id, summary: `${actor.name} sửa công trình "${input.name.trim()}" (${input.code.trim()}).` });
}
export async function deleteProject(actor: Actor, id: number) {
  const [existing] = await db.select({ code: projects.code, name: projects.name }).from(projects).where(eq(projects.id, id));
  await db.delete(projects).where(eq(projects.id, id));
  await logActivity(db, { actorId: actor.id, actorName: actor.name, action: "project.deleted", entityType: "project", summary: `${actor.name} xóa công trình "${existing?.name ?? ""}" (${existing?.code ?? id}).` });
}
export async function createMaterial(actor: Actor, input: { code: string; name: string; unit: string; group: string }) {
  if (!input.code?.trim() || !input.name?.trim() || !input.unit?.trim()) throw new Error("Mã, tên và đơn vị tính là bắt buộc.");
  await db.insert(materials).values({ code: input.code.trim(), name: input.name.trim(), unit: input.unit.trim(), group: input.group?.trim() || "Khác" });
  await logActivity(db, { actorId: actor.id, actorName: actor.name, action: "material.created", entityType: "material", summary: `${actor.name} thêm vật tư "${input.name.trim()}" (${input.code.trim()}).` });
}
export async function updateMaterial(actor: Actor, id: number, input: { code: string; name: string; unit: string; group: string }) {
  await db.update(materials).set({ code: input.code.trim(), name: input.name.trim(), unit: input.unit.trim(), group: input.group?.trim() || "Khác" }).where(eq(materials.id, id));
  await logActivity(db, { actorId: actor.id, actorName: actor.name, action: "material.updated", entityType: "material", entityId: id, summary: `${actor.name} sửa vật tư "${input.name.trim()}" (${input.code.trim()}).` });
}
export async function deleteMaterial(actor: Actor, id: number) {
  const [existing] = await db.select({ code: materials.code, name: materials.name }).from(materials).where(eq(materials.id, id));
  await db.delete(materials).where(eq(materials.id, id));
  await logActivity(db, { actorId: actor.id, actorName: actor.name, action: "material.deleted", entityType: "material", summary: `${actor.name} xóa vật tư "${existing?.name ?? ""}" (${existing?.code ?? id}).` });
}

export async function listBudgets(projectId: number) {
  return db.select({ id: budgets.id, materialId: budgets.materialId, name: materials.name, unit: materials.unit,
    group: materials.group, qty: budgets.qty, unitPrice: budgets.unitPrice }).from(budgets)
    .innerJoin(materials, eq(budgets.materialId, materials.id)).where(eq(budgets.projectId, projectId))
    .orderBy(asc(materials.group), asc(materials.name));
}
export async function upsertBudget(actor: Actor, input: { projectId: number; materialId: number; qty: number; unitPrice: number }) {
  if (!input.projectId || !input.materialId) throw new Error("Vui lòng chọn công trình và vật tư.");
  await db.insert(budgets).values({ projectId: input.projectId, materialId: input.materialId, qty: toNumber(input.qty).toFixed(3), unitPrice: toNumber(input.unitPrice).toFixed(2) })
    .onConflictDoUpdate({ target: [budgets.projectId, budgets.materialId], set: { qty: toNumber(input.qty).toFixed(3), unitPrice: toNumber(input.unitPrice).toFixed(2) } });
  const [[project], [material]] = await Promise.all([
    db.select({ name: projects.name }).from(projects).where(eq(projects.id, input.projectId)),
    db.select({ name: materials.name }).from(materials).where(eq(materials.id, input.materialId)),
  ]);
  await logActivity(db, { actorId: actor.id, actorName: actor.name, action: "budget.upserted", entityType: "budget", summary: `${actor.name} cập nhật dự toán "${material?.name ?? ""}" cho công trình "${project?.name ?? ""}".` });
}
export async function deleteBudget(actor: Actor, id: number) {
  await db.delete(budgets).where(eq(budgets.id, id));
  await logActivity(db, { actorId: actor.id, actorName: actor.name, action: "budget.deleted", entityType: "budget", summary: `${actor.name} xóa một dòng dự toán.` });
}
