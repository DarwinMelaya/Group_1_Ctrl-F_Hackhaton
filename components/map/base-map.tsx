"use client";

import "leaflet/dist/leaflet.css";
import type { ReactNode } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { MARINDUQUE_CENTER, MARINDUQUE_ZOOM } from "@/lib/zones/geo";
import { cn } from "@/lib/utils";

// OpenStreetMap standard tiles: no API key; attribution required (tile usage policy: light, interactive use).
// Colors are muted with CSS (.huliko-map in globals.css) so zones and data layers stand out; dark mode inverts them.
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Client-only. Import through next/dynamic with ssr: false. */
export function BaseMap({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <MapContainer
      center={MARINDUQUE_CENTER}
      zoom={MARINDUQUE_ZOOM}
      minZoom={9}
      maxZoom={17}
      zoomControl={false}
      className={cn("huliko-map h-full w-full bg-muted", className)}
    >
      <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} />
      <ZoomControl position="bottomright" />
      {children}
    </MapContainer>
  );
}
