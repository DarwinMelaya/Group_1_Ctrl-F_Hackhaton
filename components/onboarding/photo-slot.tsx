import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reserved 4:3 space for a real photo the team will supply (no generated illustrations).
 * When `src` is set the photo is shown; until then a neutral placeholder states which photo belongs here.
 */
export function PhotoSlot({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return (
    <div className={cn("relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- local static photo; explicit aspect box prevents layout shift
        <img src={src} alt={alt} className="h-full w-full object-cover" decoding="async" />
      ) : (
        <div role="img" aria-label={alt} className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-border p-6 text-center text-muted-foreground">
          <ImageIcon className="size-8" aria-hidden />
          <span className="text-sm leading-snug">{alt}</span>
        </div>
      )}
    </div>
  );
}
