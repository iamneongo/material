"use client";

import Link from "next/link";
import { DataTable, type Column, type SelectFilter } from "@/components/data-table";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatVND, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/db/schema";

export type OrderRow = {
  id: number;
  code: string;
  projectName: string;
  creatorName: string;
  supplierName: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
};

export function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const columns: Column<OrderRow>[] = [
    {
      key: "code",
      header: "Mã đơn",
      sortValue: (r) => r.code,
      filterValue: (r) => r.code,
      cell: (r) => (
        <Link
          href={`/orders/${r.id}`}
          className="font-medium text-primary hover:underline"
        >
          {r.code}
        </Link>
      ),
    },
    {
      key: "project",
      header: "Công trình",
      sortValue: (r) => r.projectName,
      filterValue: (r) => r.projectName,
    },
    {
      key: "creator",
      header: "Người tạo",
      sortValue: (r) => r.creatorName,
      filterValue: (r) => r.creatorName,
      cell: (r) => <span className="text-muted-foreground">{r.creatorName}</span>,
    },
    {
      key: "createdAt",
      header: "Ngày",
      sortValue: (r) => Date.parse(r.createdAt),
      cell: (r) => (
        <span className="text-muted-foreground">{formatDate(r.createdAt)}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      sortValue: (r) => ORDER_STATUS_LABELS[r.status],
      filterValue: (r) => ORDER_STATUS_LABELS[r.status],
      cell: (r) => <OrderStatusBadge status={r.status} />,
    },
    {
      key: "total",
      header: "Thành tiền",
      align: "right",
      sortValue: (r) => r.total,
      cell: (r) => (
        <span className="font-medium tabular-nums">{formatVND(r.total)}</span>
      ),
    },
  ];

  const filters: SelectFilter<OrderRow>[] = [
    {
      key: "status",
      label: "Tất cả trạng thái",
      options: (Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => ({
        value: s,
        label: ORDER_STATUS_LABELS[s],
      })),
      predicate: (r, v) => r.status === v,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowKey={(r) => r.id}
      searchPlaceholder="Tìm theo mã đơn, công trình, người tạo..."
      filters={filters}
      initialSort={{ key: "createdAt", dir: "desc" }}
      emptyMessage="Chưa có đơn nào."
    />
  );
}
