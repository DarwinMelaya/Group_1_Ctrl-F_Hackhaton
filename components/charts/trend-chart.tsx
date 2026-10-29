"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompact, formatDayLong, formatDayShort, formatKg, formatNumber } from "@/lib/format";
import { AXIS_TICK, ChartTooltipBox, GRID_STROKE, SERIES_COLOR, SURFACE_COLOR } from "./chart-tooltip";

export type TrendPoint = { day: string; kg: number; logs: number };

/** Daily catch weight. One series: 2px line over a 10% wash, crosshair tooltip. */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const ticks = niceTicks(Math.max(0, ...points.map((p) => p.kg)));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeWidth={1} />
          <XAxis
            dataKey="day"
            tickFormatter={formatDayShort}
            tick={AXIS_TICK}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            tickFormatter={formatCompact}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
            content={({ active, payload }) => {
              const point = active ? (payload?.[0]?.payload as TrendPoint | undefined) : undefined;
              if (!point) return null;
              return (
                <ChartTooltipBox
                  title={formatDayLong(point.day)}
                  rows={[
                    { label: "Catch", value: formatKg(point.kg), swatch: true },
                    { label: "Logs", value: formatNumber(point.logs) },
                  ]}
                />
              );
            }}
          />
          <Area
            type="linear"
            dataKey="kg"
            stroke={SERIES_COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill={SERIES_COLOR}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 4, fill: SERIES_COLOR, stroke: SURFACE_COLOR, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** About four round intervals (steps of 1, 2, 2.5 or 5 x 10^n) from 0 to just above max. */
function niceTicks(max: number, intervals = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)!;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
}
