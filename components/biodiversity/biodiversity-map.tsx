"use client";

import L from "leaflet";
import "leaflet.heat";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { BaseMap } from "@/components/map/base-map";
import type { HeatPoint, TrendCell, TrendStatus } from "@/lib/analytics/biodiversity";
import { formatPercent } from "@/lib/format";
import { TREND_META } from "./trend-status";

export type BiodiversityMapProps = {
  cells: TrendCell[];
  heat: HeatPoint[];
  focusKey: string | null;
  showCells: boolean;
  windowDays: number;
  onFocus: (key: string) => void;
};

export default function BiodiversityMap(props: BiodiversityMapProps) {
  return (
    <BaseMap>
      <HeatLayers heat={props.heat} />
      <CellLayer {...props} />
    </BaseMap>
  );
}

const HEAT_STATUSES: TrendStatus[] = ["insufficient", "abundant", "declining", "critical"];

/** One heat layer per status, each in its own hue. A shared max keeps intensity comparable across layers. */
function HeatLayers({ heat }: { heat: HeatPoint[] }) {
  const map = useMap();
  useEffect(() => {
    const sorted = heat.map((h) => h.kg).sort((a, b) => a - b);
    const max = sorted.length ? sorted[Math.floor(sorted.length * 0.9)] : 1;
    const layers = HEAT_STATUSES.map((status) =>
      L.heatLayer(
        heat.filter((h) => h.status === status).map((h) => [h.lat, h.lng, h.kg] as L.HeatLatLngTuple),
        { radius: 28, blur: 22, maxZoom: 13, max, minOpacity: 0.25, gradient: TREND_META[status].gradient },
      ).addTo(map),
    );
    return () => layers.forEach((l) => l.remove());
  }, [map, heat]);
  return null;
}

function CellLayer({ cells, focusKey, showCells, windowDays, onFocus }: BiodiversityMapProps) {
  const map = useMap();
  const rects = useRef(new Map<string, L.Rectangle>());
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  useEffect(() => {
    const registry = rects.current;
    const group = L.featureGroup();
    for (const cell of cells) {
      const meta = TREND_META[cell.status];
      const rect = L.rectangle(
        [
          [cell.south, cell.west],
          [cell.north, cell.east],
        ],
        {
          color: meta.color,
          weight: 1,
          opacity: showCells ? 0.9 : 0,
          fillColor: meta.color,
          fillOpacity: showCells ? 0.04 : 0,
          dashArray: cell.status === "insufficient" ? "4 4" : undefined,
        },
      );
      rect.bindTooltip(tooltipHtml(cell, windowDays), { sticky: true, direction: "top", className: "huliko-tooltip" });
      rect.on("click", () => onFocusRef.current(cell.key));
      group.addLayer(rect);
      registry.set(cell.key, rect);
    }
    group.addTo(map);
    return () => {
      registry.clear();
      group.remove();
    };
  }, [map, cells, showCells, windowDays]);

  useEffect(() => {
    const registry = rects.current;
    if (!focusKey) return;
    const rect = registry.get(focusKey);
    if (!rect) return;
    map.flyToBounds(rect.getBounds(), { padding: [80, 80], maxZoom: 12, duration: 0.6 });
    rect.setStyle({ weight: 3, opacity: 1 });
    rect.openTooltip(rect.getCenter());
    return () => {
      rect.setStyle({ weight: 1, opacity: showCells ? 0.9 : 0 });
      rect.closeTooltip();
    };
  }, [map, focusKey, cells, showCells]);

  return null;
}

function tooltipHtml(cell: TrendCell, days: number) {
  const meta = TREND_META[cell.status];
  const change = cell.change === null ? "No baseline" : `${cell.change > 0 ? "+" : ""}${formatPercent(cell.change)}`;
  const kg = (v: number) => `${v.toLocaleString("en-PH", { maximumFractionDigits: 1 })} kg/day`;
  return `
    <div style="min-width:200px">
      <div style="font-weight:600;margin-bottom:2px">${cell.area}</div>
      <div style="color:${meta.color};font-weight:600;margin-bottom:6px">${meta.label}</div>
      <table style="width:100%;font-variant-numeric:tabular-nums">
        <tr><td style="opacity:.7">Last ${days} days</td><td style="text-align:right">${kg(cell.currentKgPerDay)} · ${cell.currentLogs} logs</td></tr>
        <tr><td style="opacity:.7">${days} days before</td><td style="text-align:right">${kg(cell.previousKgPerDay)} · ${cell.previousLogs} logs</td></tr>
        <tr><td style="opacity:.7">Change</td><td style="text-align:right;font-weight:600">${change}</td></tr>
      </table>
    </div>`;
}
