import { z } from "zod";
import { Constants } from "@/lib/database.types";

const position = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

/** GeoJSON Polygon in lng/lat (what Leaflet's toGeoJSON() produces). One outer ring, no holes. */
export const polygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(position).min(4, "A zone needs at least three corners.")).length(1),
});

export const zoneInputSchema = z.object({
  id: z.guid().nullable(),
  name: z.string().trim().min(3, "Give the zone a name of at least 3 characters.").max(80, "Keep the name under 80 characters."),
  type: z.enum(Constants.public.Enums.zone_type),
  reason: z.string().trim().max(300, "Keep the reason under 300 characters."),
  active: z.boolean(),
  geometry: polygonSchema,
});

export type ZoneInput = z.infer<typeof zoneInputSchema>;
export type PolygonGeometry = z.infer<typeof polygonSchema>;
