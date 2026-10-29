"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REPORT_TYPE_LABELS } from "@/lib/reports/labels";
import type { ReportType } from "@/lib/types";

export function ReportTypeFilter({ value }: { value: ReportType | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      value={value ?? "all"}
      onValueChange={(v) => {
        const p = new URLSearchParams(searchParams.toString());
        if (v === "all") p.delete("type");
        else p.set("type", v);
        p.delete("id");
        router.push(`${pathname}?${p}`, { scroll: false });
      }}
    >
      <SelectTrigger className="h-9 w-full" aria-label="Report type">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All report types</SelectItem>
        {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((t) => (
          <SelectItem key={t} value={t}>
            {REPORT_TYPE_LABELS[t]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
