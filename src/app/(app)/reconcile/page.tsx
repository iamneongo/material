import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { budgets, materials, projectMaterialActual, projects } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { ProjectPicker } from "@/components/project-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReconcileChart } from "./reconcile-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  cn,
  formatVND,
  formatNumber,
  formatPercent,
  toNumber,
} from "@/lib/utils";

export default async function ReconcilePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;

  const allProjects = await db
    .select({ id: projects.id, name: projects.name, code: projects.code })
    .from(projects)
    .orderBy(asc(projects.name));

  if (allProjects.length === 0) {
    return (
      <div>
        <PageHeader title="Đối chiếu dự toán / thực tế" />
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Chưa có công trình nào.
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedId = sp.project ? Number(sp.project) : allProjects[0].id;

  // Lấy dự toán + thực tế cho công trình được chọn
  const [budgetRows, actualRows] = await Promise.all([
    db
      .select({
        materialId: budgets.materialId,
        name: materials.name,
        unit: materials.unit,
        group: materials.group,
        qty: budgets.qty,
        unitPrice: budgets.unitPrice,
      })
      .from(budgets)
      .innerJoin(materials, eq(budgets.materialId, materials.id))
      .where(eq(budgets.projectId, selectedId)),
    db
      .select({
        materialId: projectMaterialActual.materialId,
        name: materials.name,
        unit: materials.unit,
        group: materials.group,
        qty: projectMaterialActual.qty,
        amount: projectMaterialActual.amount,
      })
      .from(projectMaterialActual)
      .innerJoin(materials, eq(projectMaterialActual.materialId, materials.id))
      .where(eq(projectMaterialActual.projectId, selectedId)),
  ]);

  // Gộp theo materialId
  type Row = {
    materialId: number;
    name: string;
    unit: string;
    group: string;
    budgetQty: number;
    budgetAmount: number;
    actualQty: number;
    actualAmount: number;
  };
  const map = new Map<number, Row>();

  for (const b of budgetRows) {
    map.set(b.materialId, {
      materialId: b.materialId,
      name: b.name,
      unit: b.unit,
      group: b.group,
      budgetQty: toNumber(b.qty),
      budgetAmount: toNumber(b.qty) * toNumber(b.unitPrice),
      actualQty: 0,
      actualAmount: 0,
    });
  }
  for (const a of actualRows) {
    const existing = map.get(a.materialId);
    if (existing) {
      existing.actualQty = toNumber(a.qty);
      existing.actualAmount = toNumber(a.amount);
    } else {
      map.set(a.materialId, {
        materialId: a.materialId,
        name: a.name,
        unit: a.unit,
        group: a.group,
        budgetQty: 0,
        budgetAmount: 0,
        actualQty: toNumber(a.qty),
        actualAmount: toNumber(a.amount),
      });
    }
  }

  const rows = Array.from(map.values()).sort((x, y) =>
    x.group === y.group
      ? x.name.localeCompare(y.name)
      : x.group.localeCompare(y.group)
  );

  const totalBudget = rows.reduce((s, r) => s + r.budgetAmount, 0);
  const totalActual = rows.reduce((s, r) => s + r.actualAmount, 0);
  const totalDiff = totalActual - totalBudget;

  return (
    <div>
      <PageHeader
        title="Đối chiếu dự toán / thực tế"
        description="So sánh số lượng và chi phí thực tế với dự toán theo từng công trình."
        action={
          <ProjectPicker
            projects={allProjects}
            value={String(selectedId)}
          />
        }
      />

      {/* Summary */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Dự toán" value={formatVND(totalBudget)} />
        <SummaryCard label="Thực tế" value={formatVND(totalActual)} />
        <SummaryCard
          label="Chênh lệch"
          value={formatVND(totalDiff)}
          tone={totalDiff > 0 ? "danger" : "ok"}
        />
      </div>

      {rows.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Biểu đồ dự toán vs thực tế
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReconcileChart
              data={rows
                .filter((r) => r.budgetAmount > 0 || r.actualAmount > 0)
                .map((r) => ({
                  name: r.name,
                  budget: r.budgetAmount,
                  actual: r.actualAmount,
                }))}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Chưa có dự toán hoặc phát sinh thực tế cho công trình này.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vật tư</TableHead>
                  <TableHead className="text-right">SL dự toán</TableHead>
                  <TableHead className="text-right">SL thực tế</TableHead>
                  <TableHead className="text-right">Tiền dự toán</TableHead>
                  <TableHead className="text-right">Tiền thực tế</TableHead>
                  <TableHead className="text-right">Chênh lệch</TableHead>
                  <TableHead className="text-right">% so dự toán</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const diff = r.actualAmount - r.budgetAmount;
                  const over = r.budgetAmount > 0 && r.actualAmount > r.budgetAmount;
                  const noBudget = r.budgetAmount === 0 && r.actualAmount > 0;
                  const percent =
                    r.budgetAmount > 0
                      ? (r.actualAmount / r.budgetAmount) * 100
                      : null;
                  const warn = over || noBudget;
                  return (
                    <TableRow
                      key={r.materialId}
                      className={cn(warn && "bg-red-50 dark:bg-red-950/20")}
                    >
                      <TableCell>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.group}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(r.budgetQty)} {r.unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(r.actualQty)} {r.unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatVND(r.budgetAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatVND(r.actualAmount)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums font-medium",
                          diff > 0
                            ? "text-red-600"
                            : diff < 0
                              ? "text-emerald-600"
                              : ""
                        )}
                      >
                        {formatVND(diff)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {noBudget ? (
                          <Badge variant="destructive">Ngoài dự toán</Badge>
                        ) : percent === null ? (
                          "—"
                        ) : (
                          <span
                            className={cn(
                              over ? "font-semibold text-red-600" : ""
                            )}
                          >
                            {formatPercent(percent)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="mt-3 text-xs text-muted-foreground">
        * Dòng tô đỏ: thực tế vượt dự toán hoặc vật tư phát sinh ngoài dự toán.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger" | "ok";
}) {
  return (
    <Card>
      <CardContent className="py-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={cn(
            "text-xl font-semibold tabular-nums",
            tone === "danger" && "text-red-600",
            tone === "ok" && "text-emerald-600"
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
