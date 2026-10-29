"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  description?: string;
  /** Same data as the chart, as a table (accessibility and exact values). */
  table: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ChartCard({ title, description, table, children, className }: ChartCardProps) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <section className={cn("flex flex-col rounded-lg border bg-card", className)} aria-label={title}>
      <header className="flex items-start justify-between gap-4 px-4 pb-2 pt-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div role="group" aria-label="View as" className="flex shrink-0 rounded-md border p-0.5">
          <ViewButton active={view === "chart"} onClick={() => setView("chart")} label="Chart">
            <BarChart3 className="size-3.5" />
          </ViewButton>
          <ViewButton active={view === "table"} onClick={() => setView("table")} label="Table">
            <Table2 className="size-3.5" />
          </ViewButton>
        </div>
      </header>
      <div className="min-h-0 flex-1 px-4 pb-4">{view === "chart" ? children : table}</div>
    </section>
  );
}

function ViewButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {label}
    </button>
  );
}

/** Compact table used for chart table views. */
export function DataTable({ columns, rows }: { columns: { label: string; numeric?: boolean }[]; rows: (string | number)[][] }) {
  return (
    <div className="max-h-80 overflow-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted">
          <tr>
            {columns.map((c) => (
              <th key={c.label} scope="col" className={cn("px-3 py-2 text-xs font-medium text-muted-foreground", c.numeric ? "text-right" : "text-left")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className={cn("px-3 py-1.5", columns[c]?.numeric && "text-right tabular")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
