"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompact, formatKg, formatNumber } from "@/lib/format";
import { AXIS_TICK, ChartTooltipBox, GRID_STROKE, SERIES_COLOR } from "./chart-tooltip";

type LabelProps = { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: number | string };

/** Value at the bar tip, one line, in text ink (never the series color). */
function BarValueLabel({ x = 0, y = 0, width = 0, height = 0, value }: LabelProps) {
  return (
    <text
      x={Number(x) + Number(width) + 6}
      y={Number(y) + Number(height) / 2}
      dominantBaseline="central"
      fill="hsl(var(--foreground))"
      fontSize={11}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {formatKg(Number(value))}
    </text>
  );
}

export type RankedRow = { label: string; sublabel?: string; kg: number; logs: number };

const ROW_HEIGHT = 34;

/** Horizontal bars, largest first. One series: no legend, the card title names it. */
export function RankedBarChart({ rows, labelWidth = 104 }: { rows: RankedRow[]; labelWidth?: number }) {
  return (
    <div style={{ height: rows.length * ROW_HEIGHT + 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 64, bottom: 0, left: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={GRID_STROKE} strokeWidth={1} />
          <XAxis type="number" tickFormatter={formatCompact} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={labelWidth}
            tick={{ ...AXIS_TICK, fill: "hsl(var(--foreground))", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={({ active, payload }) => {
              const row = active ? (payload?.[0]?.payload as RankedRow | undefined) : undefined;
              if (!row) return null;
              return (
                <ChartTooltipBox
                  title={row.sublabel ? `${row.label} (${row.sublabel})` : row.label}
                  rows={[
                    { label: "Catch", value: formatKg(row.kg), swatch: true },
                    { label: "Logs", value: formatNumber(row.logs) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="kg" fill={SERIES_COLOR} barSize={16} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="kg" content={BarValueLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
