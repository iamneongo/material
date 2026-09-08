"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SelectField } from "@/components/select-field";

export function ProjectPicker({
  projects,
  value,
  paramName = "project",
}: {
  projects: { id: number; name: string; code: string }[];
  value?: string;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set(paramName, v);
    else params.delete(paramName);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <SelectField
      value={value ?? ""}
      onChange={onChange}
      className="w-full max-w-xs sm:w-64"
      placeholder="Chọn công trình"
      options={projects.map((p) => ({
        value: String(p.id),
        label: `${p.code} · ${p.name}`,
      }))}
    />
  );
}
