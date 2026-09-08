import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  getMaterialCostStats,
  getSupplierDebts,
  monthRange,
} from "@/lib/reports";

function csvCell(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const month = sp.get("month") ?? undefined;
  const projectParam = sp.get("project");
  const projectId = projectParam ? Number(projectParam) : undefined;
  const { start, end, label } = monthRange(month);

  const [materialStats, debts] = await Promise.all([
    getMaterialCostStats({ start, end, projectId }),
    getSupplierDebts(),
  ]);

  const lines: string[] = [];
  lines.push(`Thống kê chi phí vật tư - Tháng ${label}`);
  lines.push("");
  lines.push(
    ["Vật tư", "Nhóm", "Số lượng", "Đơn vị", "Thành tiền (VND)"]
      .map(csvCell)
      .join(",")
  );
  for (const r of materialStats) {
    lines.push(
      [r.name, r.group, r.qty, r.unit, Math.round(r.amount)]
        .map(csvCell)
        .join(",")
    );
  }
  const totalCost = materialStats.reduce((s, r) => s + r.amount, 0);
  lines.push(["Tổng chi phí", "", "", "", Math.round(totalCost)].map(csvCell).join(","));

  lines.push("");
  lines.push("Công nợ theo cửa hàng (toàn thời gian)");
  lines.push(
    ["Cửa hàng", "Đã giao (VND)", "Đã thanh toán (VND)", "Còn nợ (VND)"]
      .map(csvCell)
      .join(",")
  );
  for (const d of debts) {
    lines.push(
      [
        d.name,
        Math.round(d.delivered),
        Math.round(d.paid),
        Math.round(d.debt),
      ]
        .map(csvCell)
        .join(",")
    );
  }

  // BOM để Excel đọc đúng tiếng Việt UTF-8
  const csv = "﻿" + lines.join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="thong-ke-${label.replace(
        "/",
        "-"
      )}.csv"`,
    },
  });
}
