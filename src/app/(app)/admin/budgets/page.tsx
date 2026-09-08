import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, materials, budgets } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { ProjectPicker } from "@/components/project-picker";
import { Card, CardContent } from "@/components/ui/card";
import { BudgetManager } from "./budget-manager";

export default async function AdminBudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  await requireRole(["admin"]);
  const sp = await searchParams;

  const [allProjects, materialList] = await Promise.all([
    db
      .select({ id: projects.id, name: projects.name, code: projects.code })
      .from(projects)
      .orderBy(asc(projects.name)),
    db
      .select()
      .from(materials)
      .orderBy(asc(materials.group), asc(materials.name)),
  ]);

  if (allProjects.length === 0) {
    return (
      <div>
        <PageHeader title="Dự toán công trình" />
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Vui lòng tạo công trình trước.
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedId = sp.project ? Number(sp.project) : allProjects[0].id;

  const rows = await db
    .select({
      id: budgets.id,
      materialId: budgets.materialId,
      name: materials.name,
      unit: materials.unit,
      group: materials.group,
      qty: budgets.qty,
      unitPrice: budgets.unitPrice,
    })
    .from(budgets)
    .innerJoin(materials, eq(budgets.materialId, materials.id))
    .where(eq(budgets.projectId, selectedId))
    .orderBy(asc(materials.group), asc(materials.name));

  return (
    <div>
      <PageHeader
        title="Dự toán công trình"
        description="Thiết lập số lượng và đơn giá dự toán cho từng vật tư theo công trình."
        action={
          <ProjectPicker projects={allProjects} value={String(selectedId)} />
        }
      />
      <BudgetManager
        projectId={selectedId}
        materials={materialList.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
          group: m.group,
        }))}
        rows={rows}
      />
    </div>
  );
}
