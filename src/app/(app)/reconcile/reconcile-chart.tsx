"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatVND } from "@/lib/utils";

const config = {
  budget: { label: "Dự toán", color: "var(--chart-1)" },
  actual: { label: "Thực tế", color: "var(--chart-2)" },
} satisfies ChartConfig;

function shorten(name: string) {
  return name.length > 12 ? name.slice(0, 11) + "…" : name;
}

export function ReconcileChart({
  data,
}: {
  data: { name: string; budget: number; actual: number }[];
}) {
  if (data.length === 0) return null;
  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tickFormatter={shorten}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
        />
        <YAxis
          tickFormatter={(v) => new Intl.NumberFormat("vi-VN", {
            notation: "compact",
          }).format(v as number)}
          tickLine={false}
          axisLine={false}
          width={48}
          fontSize={11}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full justify-between gap-3">
                  <span className="text-muted-foreground">
                    {config[name as keyof typeof config]?.label}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatVND(value as number)}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="budget" fill="var(--color-budget)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="actual" fill="var(--color-actual)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
