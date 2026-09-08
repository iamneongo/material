"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/select-field";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

const ALL = "all";

export function ReportFilters({
  month,
  projectId,
  projects,
}: {
  month: string;
  projectId: string;
  projects: { id: number; name: string; code: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    router.push(`${pathname}?${params.toString()}`);
  }

  const exportHref = `/api/export/report?${new URLSearchParams({
    month,
    ...(projectId ? { project: projectId } : {}),
  }).toString()}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="month"
        className="w-[160px]"
        value={month}
        onChange={(e) => setParam("month", e.target.value)}
      />
      <SelectField
        value={projectId || ALL}
        onChange={(v) => setParam("project", v === ALL ? "" : v)}
        className="w-56"
        options={[
          { value: ALL, label: "Tất cả công trình" },
          ...projects.map((p) => ({
            value: String(p.id),
            label: `${p.code} · ${p.name}`,
          })),
        ]}
      />
      <a href={exportHref} className={cn(buttonVariants({ variant: "outline" }))}>
        <Download className="size-4" /> Xuất CSV
      </a>
    </div>
  );
}
