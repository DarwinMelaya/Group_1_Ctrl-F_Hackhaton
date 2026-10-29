"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { BaseMap } from "@/components/map/base-map";
import { flagLabel } from "@/lib/catch/flags";
import { CATCH_STATUS_LABELS } from "@/lib/catch/status";
import { HOTSPOT_CELL_DEG, type Hotspot, type Incident } from "@/lib/analytics/hotspots";
import { REPORT_STATUS_LABELS, REPORT_TYPE_LABELS } from "@/lib/reports/labels";
import type { ZoneWithGeoJson } from "@/lib/types";
import { ZONE_COLORS } from "@/lib/zones/geo";
import { MARKER_COLORS } from "./markers";

export type HotspotMapProps = {
  hotspots: Hotspot[];
  zones: ZoneWithGeoJson[];
  selectedKey: string | null;
  layers: { catches: boolean; reports: boolean; zones: boolean };
  onSelect: (key: string) => void;
};

export default function HotspotMap(props: HotspotMapProps) {
  return (
    <BaseMap>
      <Layers {...props} />
    </BaseMap>
  );
}

// Lucide "siren" path, inlined so report markers need no extra request.
const SIREN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1z"/><path d="M12 2v2"/></svg>';

function reportIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;border-radius:4px;background:${color};border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgb(0 0 0/.3)">${SIREN_SVG}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function rankIcon(rank: number, selected: boolean) {
  const size = selected ? 30 : 24;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:${selected ? "#0F766E" : "#14304F"};color:white;border:2px solid white;display:flex;align-items:center;justify-content:center;font:600 ${selected ? 13 : 12}px var(--font-sans);box-shadow:0 1px 4px rgb(0 0 0/.35)">${rank}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const date = (iso: string) => new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });

function incidentTooltip(i: Incident) {
  if (i.kind === "catch") {
    const reasons = i.reasons.map((r) => `<li>${escape(flagLabel(r))}</li>`).join("");
    return `<div style="max-width:240px"><div style="font-weight:600">${escape(i.species)} · ${date(i.at)}</div>
      <div style="color:${MARKER_COLORS[i.status === "reviewed" ? "reviewed" : "flagged"]};font-weight:600;margin:2px 0 4px">${CATCH_STATUS_LABELS[i.status].label}</div>
      <div style="opacity:.75">${escape(i.fisher)}${i.zoneName ? ` · ${escape(i.zoneName)}` : ""}</div>
      <ul style="margin:4px 0 0 14px;list-style:disc">${reasons}</ul></div>`;
  }
  return `<div style="max-width:240px"><div style="font-weight:600">Report: ${escape(REPORT_TYPE_LABELS[i.type])} · ${date(i.at)}</div>
    <div style="color:${MARKER_COLORS[i.status]};font-weight:600;margin:2px 0 4px">${REPORT_STATUS_LABELS[i.status].label}</div>
    <div style="opacity:.75">${escape(i.description.slice(0, 140))}${i.description.length > 140 ? "…" : ""}</div></div>`;
}

function Layers({ hotspots, zones, selectedKey, layers, onSelect }: HotspotMapProps) {
  const map = useMap();
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Protected zones for context
  useEffect(() => {
    if (!layers.zones) return;
    const group = L.featureGroup();
    for (const z of zones) {
      if (!z.active || (z.type !== "restricted" && z.type !== "sanctuary")) continue;
      L.geoJSON(z.geojson as unknown as GeoJSON.Polygon, {
        style: { color: ZONE_COLORS[z.type], weight: 1.5, dashArray: "5 4", fillOpacity: 0.06, interactive: false },
      }).addTo(group);
    }
    group.addTo(map);
    return () => {
      group.remove();
    };
  }, [map, zones, layers.zones]);

  // Incident markers
  useEffect(() => {
    const group = L.featureGroup();
    for (const h of hotspots) {
      for (const i of h.incidents) {
        if (i.kind === "catch" && layers.catches) {
          L.circleMarker([i.lat, i.lng], {
            radius: 6,
            color: "#ffffff",
            weight: 2,
            fillColor: MARKER_COLORS[i.status === "reviewed" ? "reviewed" : "flagged"],
            fillOpacity: 1,
          })
            .bindTooltip(incidentTooltip(i), { direction: "top", className: "huliko-tooltip" })
            .on("click", () => onSelectRef.current(h.key))
            .addTo(group);
        }
        if (i.kind === "report" && layers.reports) {
          L.marker([i.lat, i.lng], { icon: reportIcon(MARKER_COLORS[i.status]), zIndexOffset: 500 })
            .bindTooltip(incidentTooltip(i), { direction: "top", className: "huliko-tooltip", offset: [0, -8] })
            .on("click", () => onSelectRef.current(h.key))
            .addTo(group);
        }
      }
    }
    group.addTo(map);
    return () => {
      group.remove();
    };
  }, [map, hotspots, layers.catches, layers.reports]);

  // Rank badges for the top 10, plus the selected cell outline
  useEffect(() => {
    const group = L.featureGroup();
    for (const h of hotspots.slice(0, 10)) {
      const selected = h.key === selectedKey;
      L.marker([h.lat, h.lng], { icon: rankIcon(h.rank, selected), zIndexOffset: selected ? 2000 : 1000, keyboard: true, title: `Hotspot ${h.rank}: ${h.area}` })
        .on("click", () => onSelectRef.current(h.key))
        .addTo(group);
    }
    const selected = hotspots.find((h) => h.key === selectedKey);
    if (selected) {
      const [i, j] = selected.key.split(":").map(Number);
      L.rectangle(
        [
          [i * HOTSPOT_CELL_DEG, j * HOTSPOT_CELL_DEG],
          [(i + 1) * HOTSPOT_CELL_DEG, (j + 1) * HOTSPOT_CELL_DEG],
        ],
        { color: "#0F766E", weight: 2, fillOpacity: 0.05, interactive: false },
      ).addTo(group);
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
    }
    group.addTo(map);
    return () => {
      group.remove();
    };
  }, [map, hotspots, selectedKey]);

  return null;
}
