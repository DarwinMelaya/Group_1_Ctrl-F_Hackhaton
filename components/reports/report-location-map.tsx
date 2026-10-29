"use client";

import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { BaseMap } from "@/components/map/base-map";
import type { ZoneWithGeoJson } from "@/lib/types";
import { ZONE_COLORS } from "@/lib/zones/geo";

type Props = { lat: number; lng: number; color: string; zones: ZoneWithGeoJson[] };

/** Small map centred on one report, with active zones for context. Client-only. */
export default function ReportLocationMap(props: Props) {
  return (
    <BaseMap>
      <Layers {...props} />
    </BaseMap>
  );
}

function Layers({ lat, lng, color, zones }: Props) {
  const map = useMap();
  useEffect(() => {
    const group = L.featureGroup();
    for (const z of zones) {
      if (!z.active || !z.type) continue;
      L.geoJSON(z.geojson as unknown as GeoJSON.Polygon, {
        style: { color: ZONE_COLORS[z.type], weight: 1.5, dashArray: "5 4", fillOpacity: 0.08, interactive: false },
      }).addTo(group);
    }
    L.circleMarker([lat, lng], { radius: 8, color: "#ffffff", weight: 3, fillColor: color, fillOpacity: 1 }).addTo(group);
    group.addTo(map);
    map.setView([lat, lng], 13, { animate: false });
    return () => {
      group.remove();
    };
  }, [map, lat, lng, color, zones]);
  return null;
}
