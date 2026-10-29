"use client";

import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import "leaflet-draw";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { BaseMap } from "@/components/map/base-map";
import type { ZoneType, ZoneWithGeoJson } from "@/lib/types";
import type { PolygonGeometry } from "@/lib/validation/zone";
import { ZONE_COLORS } from "@/lib/zones/geo";
import { NEW_ZONE_KEY } from "./zone-type";


export type ZoneMapProps = {
  zones: ZoneWithGeoJson[];
  /** Zone id, NEW_ZONE_KEY for an unsaved drawing, or null. */
  selectedKey: string | null;
  /** Shape of the zone being created (not yet saved). */
  newGeometry: PolygonGeometry | null;
  /** Type and active state from the form, so the selected shape recolors as the admin edits. */
  selectedStyle: { type: ZoneType; active: boolean } | null;
  drawing: boolean;
  editingShape: boolean;
  /** Bumped to discard unsaved vertex edits and redraw from saved data. */
  resetKey: number;
  onSelect: (id: string) => void;
  onDrawn: (geometry: PolygonGeometry) => void;
  onDrawStop: () => void;
  onShapeChange: (geometry: PolygonGeometry) => void;
};

export default function ZoneMap(props: ZoneMapProps) {
  return (
    <BaseMap>
      <ZoneLayers {...props} />
    </BaseMap>
  );
}

// leaflet-draw adds an `editing` handler to polygons at runtime; @types/leaflet-draw omits it.
type EditablePolygon = L.Polygon & { editing: { enable(): void; disable(): void } };

function styleFor(type: ZoneType, active: boolean, selected: boolean): L.PathOptions {
  const color = ZONE_COLORS[type];
  return {
    color,
    fillColor: color,
    weight: selected ? 3 : 2,
    opacity: active ? 1 : 0.6,
    fillOpacity: selected ? 0.3 : active ? 0.18 : 0.06,
    dashArray: active ? undefined : "6 6",
  };
}

function toPolygonLayer(geometry: unknown) {
  return L.geoJSON(geometry as GeoJSON.Polygon).getLayers()[0] as EditablePolygon;
}

function geometryOf(layer: L.Polygon) {
  return (layer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>).geometry as PolygonGeometry;
}

function ZoneLayers({
  zones,
  selectedKey,
  newGeometry,
  selectedStyle,
  drawing,
  editingShape,
  resetKey,
  onSelect,
  onDrawn,
  onDrawStop,
  onShapeChange,
}: ZoneMapProps) {
  const map = useMap();
  const layers = useRef(new Map<string, EditablePolygon>());

  // Keep the latest callbacks without re-running the Leaflet effects.
  const callbacks = useRef({ onSelect, onDrawn, onDrawStop, onShapeChange });
  callbacks.current = { onSelect, onDrawn, onDrawStop, onShapeChange };

  // Saved zones
  useEffect(() => {
    const registry = layers.current;
    const group = L.featureGroup().addTo(map);
    for (const zone of zones) {
      const layer = toPolygonLayer(zone.geojson);
      layer.bindTooltip(zone.name ?? "Zone", { sticky: true, direction: "top" });
      layer.on("click", () => zone.id && callbacks.current.onSelect(zone.id));
      group.addLayer(layer);
      if (zone.id) registry.set(zone.id, layer);
    }
    return () => {
      for (const zone of zones) if (zone.id) registry.delete(zone.id);
      group.remove();
    };
  }, [map, zones, resetKey]);

  // Unsaved new zone
  useEffect(() => {
    if (!newGeometry) return;
    const registry = layers.current;
    const layer = toPolygonLayer(newGeometry).addTo(map);
    registry.set(NEW_ZONE_KEY, layer);
    return () => {
      registry.delete(NEW_ZONE_KEY);
      layer.remove();
    };
  }, [map, newGeometry]);

  // Styling
  useEffect(() => {
    for (const zone of zones) {
      if (!zone.id || !zone.type) continue;
      const selected = zone.id === selectedKey;
      const style = selected && selectedStyle ? selectedStyle : { type: zone.type, active: zone.active ?? true };
      layers.current.get(zone.id)?.setStyle(styleFor(style.type, style.active, selected));
    }
    if (selectedStyle) layers.current.get(NEW_ZONE_KEY)?.setStyle(styleFor(selectedStyle.type, true, true));
    if (selectedKey) layers.current.get(selectedKey)?.bringToFront();
  }, [zones, selectedKey, selectedStyle, newGeometry, resetKey]);

  // Zoom to the selected zone
  useEffect(() => {
    const layer = selectedKey ? layers.current.get(selectedKey) : null;
    if (layer) map.flyToBounds(layer.getBounds(), { padding: [48, 48], maxZoom: 14, duration: 0.6 });
  }, [map, selectedKey]);

  // Vertex editing
  useEffect(() => {
    const layer = selectedKey ? layers.current.get(selectedKey) : null;
    if (!editingShape || !layer) return;
    layer.editing.enable();
    const handleEdit = () => callbacks.current.onShapeChange(geometryOf(layer));
    layer.on("edit", handleEdit);
    return () => {
      layer.off("edit", handleEdit);
      layer.editing.disable();
    };
  }, [editingShape, selectedKey, zones, newGeometry, resetKey]);

  // Drawing a new polygon
  useEffect(() => {
    if (!drawing) return;
    const handler = new L.Draw.Polygon(map as L.DrawMap, {
      allowIntersection: false,
      showArea: false, // leaflet-draw 1.0.4 throws in strict mode when showArea is on
      shapeOptions: styleFor("restricted", true, true),
    });
    handler.enable();
    const handleCreated = (event: L.LeafletEvent) =>
      callbacks.current.onDrawn(geometryOf((event as L.DrawEvents.Created).layer as L.Polygon));
    const handleStop = () => callbacks.current.onDrawStop();
    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DRAWSTOP, handleStop);
    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.DRAWSTOP, handleStop);
      handler.disable();
    };
  }, [map, drawing]);

  return null;
}
