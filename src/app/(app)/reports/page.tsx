import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatVND, formatNumber } from "@/lib/utils";
import {
  getMaterialCostStats,
  getSupplierDebts,
  monthRange,
  currentMonthValue,
} from "@/lib/reports";
import { getSuppliers } from "@/lib/data";
import { ReportFilters } from "./report-filters";
import { AddPaymentForm } from "./add-payment-form";
import { ReportsChart } from "./reports-chart";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; project?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const month = sp.month || currentMonthValue();
  const projectId = sp.project ? Number(sp.project) : undefined;
  const { start, end, label } = monthRange(month);

  const [allProjects, materialStats, debts, suppliers] = await Promise.all([
    db
      .select({ id: projects.id, name: projects.name, code: projects.code })
      .from(projects)
      .orderBy(asc(projects.name)),
    getMaterialCostStats({ start, end, projectId }),
    getSupplierDebts(),
    getSuppliers(),
  ]);

  const totalCost = materialStats.reduce((s, r) => s + r.amount, 0);
  const totalDebt = debts.reduce((s, r) => s + r.debt, 0);
  const canPay = user.role === "admin" || user.role === "director";

  // Cơ cấu chi phí theo nhóm vật tư (cho biểu đồ)
  const groupMap = new Map<string, number>();
  for (const r of materialStats) {
    groupMap.set(r.group, (groupMap.get(r.group) ?? 0) + r.amount);
  }
  const groupData = Array.from(groupMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <PageHeader
        title="Thống kê & công nợ"
        description={`Chi phí vật tư thực tế tháng ${label} và công nợ cửa hàng.`}
        action={
          <ReportFilters
            month={month}
            projectId={sp.project ?? ""}
            projects={allProjects}
          />
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="py-1">
            <div className="text-xs text-muted-foreground">
              Chi phí vật tư thực tế (tháng {label})
            </div>
            <div className="text-2xl font-semibold text-emerald-600 tabular-nums">
              {formatVND(totalCost)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-1">
            <div className="text-xs text-muted-foreground">
              Tổng công nợ cửa hàng (toàn thời gian)
            </div>
            <div
              className={cn(
                "text-2xl font-semibold tabular-nums",
                totalDebt > 0 ? "text-red-600" : "text-emerald-600"
              )}
            >
              {formatVND(totalDebt)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
      {groupData.length > 0 && (
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cơ cấu theo nhóm</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportsChart data={groupData} />
          </CardContent>
        </Card>
      )}
      {/* Chi phí theo vật tư */}
      <Card className={groupData.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Chi phí vật tư thực tế theo vật tư — tháng {label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {materialStats.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Không có đơn đã giao trong kỳ này.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vật tư</TableHead>
                  <TableHead>Nhóm</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialStats.map((r) => (
                  <TableRow key={r.materialId}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.group}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(r.qty)} {r.unit}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatVND(r.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-semibold">
                    Tổng chi phí
                  </TableCell>
                  <TableCell className="text-right text-base font-semibold tabular-nums">
                    {formatVND(totalCost)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Công nợ theo cửa hàng */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Công nợ theo cửa hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cửa hàng</TableHead>
                <TableHead className="text-right">Đã giao</TableHead>
                <TableHead className="text-right">Đã thanh toán</TableHead>
                <TableHead className="text-right">Còn nợ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((d) => (
                <TableRow key={d.supplierId}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatVND(d.delivered)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatVND(d.paid)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold tabular-nums",
                      d.debt > 0 ? "text-red-600" : "text-emerald-600"
                    )}
                  >
                    {formatVND(d.debt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {canPay && (
            <div className="px-4 pb-4">
              <AddPaymentForm
                suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
