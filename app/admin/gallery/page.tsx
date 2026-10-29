import type { Metadata } from "next";
import Link from "next/link";
import { Images } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState, ErrorState } from "@/components/data/states";
import { GalleryCard, type GalleryCardItem } from "@/components/gallery/gallery-card";
import { ReefOverview } from "@/components/gallery/reef-overview";
import { nearestTown } from "@/lib/analytics/biodiversity";
import { GALLERY_BUCKET } from "@/lib/gallery/labels";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Gallery" };

const TABS = [
  { value: "waiting", label: "Waiting for review" },
  { value: "public", label: "Public" },
  { value: "all", label: "All" },
] as const;
type Tab = (typeof TABS)[number]["value"];

export default async function GalleryPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab: Tab = TABS.some((t) => t.value === searchParams.tab) ? (searchParams.tab as Tab) : "waiting";
  const supabase = createClient();
  const { data, error } = await supabase.from("gallery_details").select("*").order("created_at", { ascending: false }).limit(500);

  const header = (
    <PageHeader
      title="Gallery"
      description="Photos of reefs and fishing spots shared by the community. Approve a photo to make it public, or hide it. Correct the reef condition if needed."
    />
  );
  if (error) {
    return (
      <>
        {header}
        <ErrorState title="Could not load the gallery" description={error.message} />
      </>
    );
  }

  const items: GalleryCardItem[] = (data ?? []).map((g) => ({
    id: g.id!,
    title: g.title ?? "Untitled",
    photoUrl: g.photo_url
      ? /^https?:\/\//.test(g.photo_url)
        ? g.photo_url
        : supabase.storage.from(GALLERY_BUCKET).getPublicUrl(g.photo_url).data.publicUrl
      : null,
    hasPhotoPath: Boolean(g.photo_url),
    reefCondition: g.reef_condition,
    approved: g.approved ?? false,
    createdAt: g.created_at!,
    uploader: g.uploader_name ?? "Unknown",
    area: g.lat !== null && g.lng !== null ? nearestTown(g.lat, g.lng) : null,
  }));

  const counts: Record<Tab, number> = {
    waiting: items.filter((i) => !i.approved).length,
    public: items.filter((i) => i.approved).length,
    all: items.length,
  };
  const visible = items.filter((i) => (tab === "all" ? true : tab === "public" ? i.approved : !i.approved));

  return (
    <>
      {header}
      <ReefOverview spots={items} />

      <nav aria-label="Moderation status" className="mb-4 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "waiting" ? "/admin/gallery" : `/admin/gallery?tab=${t.value}`}
            scroll={false}
            aria-current={tab === t.value ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t.value ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t.label}
            <span className={cn("rounded px-1 text-xs tabular", tab === t.value ? "bg-primary-foreground/15" : "bg-muted")}>{counts[t.value]}</span>
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <EmptyState
          icon={Images}
          title={tab === "waiting" ? "Nothing waiting for review" : "No photos here yet"}
          description={tab === "waiting" ? "New community uploads will appear here." : "Approved photos will appear here."}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((item) => (
            <GalleryCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </>
  );
}
