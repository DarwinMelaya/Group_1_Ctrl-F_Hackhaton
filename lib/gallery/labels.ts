import type { ReefCondition } from "@/lib/types";

export const REEF_CONDITIONS: ReefCondition[] = ["good", "fair", "poor"];

export const REEF_LABELS: Record<ReefCondition, { label: string; detail: string }> = {
  good: { label: "Good", detail: "Mostly live coral or healthy seagrass, many fish." },
  fair: { label: "Fair", detail: "Some damage, bleaching or silt; still recovering." },
  poor: { label: "Poor", detail: "Mostly dead, broken or smothered coral." },
};

/** Public storage bucket for gallery photos. photo_url holds "<user id>/<file>" or a full URL. */
export const GALLERY_BUCKET = "gallery-photos";
