"use client";

import { DataTable, type Column, type SelectFilter } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ENTITY_LABELS,
  ACTIVITY_ENTITY_VARIANTS,
} from "@/lib/constants";

export type HistoryRow = {
  id: number;
  actorName: string;
  action: string;
  entityType: string;
  summary: string;
  createdAt: string;
};

export function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const columns: Column<HistoryRow>[] = [
    {
      key: "createdAt",
      header: "Thời gian",
      sortValue: (r) => Date.parse(r.createdAt),
      cell: (r) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDateTime(r.createdAt)}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Người thực hiện",
      sortValue: (r) => r.actorName,
      filterValue: (r) => r.actorName,
      cell: (r) => <span className="font-medium">{r.actorName}</span>,
    },
    {
      key: "entityType",
      header: "Loại",
      sortValue: (r) => ACTIVITY_ENTITY_LABELS[r.entityType] ?? r.entityType,
      cell: (r) => (
        <Badge variant={ACTIVITY_ENTITY_VARIANTS[r.entityType] ?? "outline"}>
          {ACTIVITY_ENTITY_LABELS[r.entityType] ?? r.entityType}
        </Badge>
      ),
    },
    {
      key: "summary",
      header: "Nội dung",
      filterValue: (r) =>
        `${r.summary} ${ACTIVITY_ACTION_LABELS[r.action] ?? ""}`,
      cell: (r) => <span>{r.summary}</span>,
    },
  ];

  const filters: SelectFilter<HistoryRow>[] = [
    {
      key: "entityType",
      label: "Tất cả loại",
      options: Object.entries(ACTIVITY_ENTITY_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      predicate: (r, v) => r.entityType === v,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowKey={(r) => r.id}
      searchPlaceholder="Tìm theo người thực hiện, nội dung..."
      filters={filters}
      initialSort={{ key: "createdAt", dir: "desc" }}
      emptyMessage="Chưa có hoạt động nào."
    />
  );
}
