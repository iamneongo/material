"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  value: { label: "Số đơn" },
} satisfies ChartConfig;

const COLORS: Record<string, string> = {
  "Chờ duyệt": "var(--chart-3)",
  "Đã duyệt": "var(--chart-1)",
  "Đã giao": "var(--chart-2)",
  "Từ chối": "var(--chart-5)",
};

export function DashboardChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ChartContainer config={config} className="h-[220px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={28}
          fontSize={11}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
          {data.map((d) => (
            <Cell key={d.name} fill={COLORS[d.name] ?? "var(--chart-1)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
