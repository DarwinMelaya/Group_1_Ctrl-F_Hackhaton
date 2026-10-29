import type { ReactNode } from "react";

/** Tooltip body shared by all charts: text tokens only; the swatch carries the series color. */
export function ChartTooltipBox({ title, rows }: { title: ReactNode; rows: { label: string; value: ReactNode; swatch?: boolean }[] }) {
  return (
    <div className="min-w-40 rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">{title}</p>
      <dl className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              {row.swatch && <span className="size-2 rounded-sm bg-chart-1" aria-hidden />}
              {row.label}
            </dt>
            <dd className="font-medium tabular text-popover-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Shared Recharts styling: recessive hairline grid and axis text in muted ink. */
export const AXIS_TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };
export const GRID_STROKE = "hsl(var(--border))";
export const SERIES_COLOR = "hsl(var(--chart-1))";
export const SURFACE_COLOR = "hsl(var(--card))";
