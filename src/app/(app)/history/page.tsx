import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { HistoryTable, type HistoryRow } from "./history-table";

export default async function HistoryPage() {
  await requireRole(["admin", "director"]);

  const rows = await db
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(200);

  const data: HistoryRow[] = rows.map((r) => ({
    id: r.id,
    actorName: r.actorName,
    action: r.action,
    entityType: r.entityType,
    summary: r.summary,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="Nhật ký hoạt động"
        description="Toàn bộ thao tác trong hệ thống: đặt/duyệt/giao đơn, thanh toán, quản lý dữ liệu."
      />
      <HistoryTable rows={data} />
    </div>
  );
}
