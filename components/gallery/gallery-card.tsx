"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Globe, ImageOff, Loader2, MapPin, ShieldQuestion, UserRound } from "lucide-react";
import { toast } from "sonner";
import { moderateGalleryItem } from "@/app/admin/gallery/actions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REEF_CONDITIONS, REEF_LABELS } from "@/lib/gallery/labels";
import type { ReefCondition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { REEF_STYLE, ReefBadge } from "./reef-condition";

export type GalleryCardItem = {
  id: string;
  title: string;
  photoUrl: string | null;
  hasPhotoPath: boolean;
  reefCondition: ReefCondition | null;
  approved: boolean;
  createdAt: string;
  uploader: string;
  area: string | null;
};

const dateFmt = (iso: string) => new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });

export function GalleryCard({ item }: { item: GalleryCardItem }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [saving, setSaving] = useState<"approve" | "hide" | "reef" | null>(null);

  async function run(kind: "approve" | "hide" | "reef", patch: { approved?: boolean; reefCondition?: ReefCondition }) {
    setSaving(kind);
    const result = await moderateGalleryItem({ id: item.id, ...patch });
    setSaving(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(kind === "approve" ? `"${item.title}" is now public` : kind === "hide" ? `"${item.title}" is hidden` : "Reef condition updated");
    startRefresh(() => router.refresh());
  }

  const busy = saving !== null || refreshing;

  return (
    <li className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className="relative aspect-[4/3] bg-muted">
        {item.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user upload from Supabase Storage
          <img src={item.photoUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="size-6" aria-hidden />
            <span className="text-xs">{item.hasPhotoPath ? "Photo could not be loaded" : "No photo uploaded"}</span>
          </div>
        )}
        <span
          className={cn(
            "absolute left-2 top-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium shadow-sm",
            item.approved ? "bg-teal text-teal-foreground" : "bg-card text-foreground",
          )}
        >
          {item.approved ? <Globe className="size-3" aria-hidden /> : <ShieldQuestion className="size-3" aria-hidden />}
          {item.approved ? "Public" : "Waiting for review"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="text-sm font-medium leading-snug">{item.title}</h3>
        <ReefBadge condition={item.reefCondition} className="w-fit" />
        <dl className="space-y-0.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Uploaded by</dt>
            <UserRound className="size-3" aria-hidden />
            <dd>
              {item.uploader} · {dateFmt(item.createdAt)}
            </dd>
          </div>
          {item.area && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Area</dt>
              <MapPin className="size-3" aria-hidden />
              <dd>{item.area}</dd>
            </div>
          )}
        </dl>

        <div className="mt-auto space-y-2 pt-2">
          <Select value={item.reefCondition ?? undefined} onValueChange={(v) => run("reef", { reefCondition: v as ReefCondition })} disabled={busy}>
            <SelectTrigger className="h-8 text-xs" aria-label={`Reef condition for ${item.title}`}>
              <SelectValue placeholder="Set reef condition" />
            </SelectTrigger>
            <SelectContent>
              {REEF_CONDITIONS.map((c) => {
                const Icon = REEF_STYLE[c].icon;
                return (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-2">
                      <Icon className="size-3.5" aria-hidden />
                      {REEF_LABELS[c].label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {item.approved ? (
            <Button variant="outline" size="sm" className="w-full" disabled={busy} onClick={() => run("hide", { approved: false })}>
              {saving === "hide" ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <EyeOff className="mr-1.5 size-4" />}
              Hide from public
            </Button>
          ) : (
            <Button size="sm" className="w-full" disabled={busy} onClick={() => run("approve", { approved: true })}>
              {saving === "approve" ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Eye className="mr-1.5 size-4" />}
              Approve and publish
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
