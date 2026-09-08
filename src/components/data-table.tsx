"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/select-field";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";

const ALL = "all";

export type Column<T> = {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  /** Giá trị dùng để sắp xếp; nếu không có, cột không sort được */
  sortValue?: (row: T) => string | number;
  /** Chuỗi dùng cho ô tìm kiếm toàn cục */
  filterValue?: (row: T) => string;
  align?: "left" | "right" | "center";
  className?: string;
  headerClassName?: string;
};

export type SelectFilter<T> = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  predicate: (row: T, value: string) => boolean;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  searchable = true,
  searchPlaceholder = "Tìm kiếm...",
  filters = [],
  initialSort,
  emptyMessage = "Không có dữ liệu.",
  rowClassName,
}: {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: SelectFilter<T>[];
  initialSort?: { key: string; dir: "asc" | "desc" };
  emptyMessage?: string;
  rowClassName?: (row: T) => string | undefined;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(
    initialSort ?? null
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const alignClass = (a?: string) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  const processed = useMemo(() => {
    let rows = data;

    // Ô tìm kiếm toàn cục
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((row) =>
        columns.some((c) => {
          const v = c.filterValue
            ? c.filterValue(row)
            : c.sortValue
              ? String(c.sortValue(row))
              : "";
          return v.toLowerCase().includes(q);
        })
      );
    }

    // Filter dropdown
    for (const f of filters) {
      const val = filterValues[f.key];
      if (val && val !== ALL) rows = rows.filter((row) => f.predicate(row, val));
    }

    // Sắp xếp
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const dir = sort.dir === "asc" ? 1 : -1;
        rows = [...rows].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (typeof av === "number" && typeof bv === "number")
            return (av - bv) * dir;
          return String(av).localeCompare(String(bv), "vi") * dir;
        });
      }
    }

    return rows;
  }, [data, query, sort, filterValues, columns, filters]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className="space-y-3">
      {(searchable || filters.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8"
              />
            </div>
          )}
          {filters.map((f) => (
            <SelectField
              key={f.key}
              value={filterValues[f.key] ?? ALL}
              onChange={(v) =>
                setFilterValues((prev) => ({ ...prev, [f.key]: v }))
              }
              className="w-auto min-w-[170px]"
              options={[
                { value: ALL, label: f.label },
                ...f.options,
              ]}
            />
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {processed.length} dòng
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => {
                const sortable = !!c.sortValue;
                const isActive = sort?.key === c.key;
                return (
                  <TableHead
                    key={c.key}
                    className={cn(alignClass(c.align), c.headerClassName)}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn(
                          "inline-flex items-center gap-1 select-none transition-colors hover:text-foreground",
                          c.align === "right" && "flex-row-reverse",
                          isActive && "text-foreground"
                        )}
                      >
                        {c.header}
                        {isActive ? (
                          sort!.dir === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processed.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              processed.map((row, i) => (
                <TableRow key={getRowKey(row, i)} className={rowClassName?.(row)}>
                  {columns.map((c) => (
                    <TableCell
                      key={c.key}
                      className={cn(alignClass(c.align), c.className)}
                    >
                      {c.cell ? c.cell(row) : c.sortValue ? c.sortValue(row) : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
