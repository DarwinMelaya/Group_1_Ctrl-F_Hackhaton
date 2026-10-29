import { MessageSquareText, Smartphone, Sparkles, UserCheck, type LucideIcon } from "lucide-react";
import { FLAG_REASONS, flagLabel, isFlagReason } from "@/lib/catch/flags";
import type { CatchSource } from "@/lib/types";
import { cn } from "@/lib/utils";

export const SOURCE_META: Record<CatchSource, { label: string; icon: LucideIcon }> = {
  app: { label: "App", icon: Smartphone },
  sms: { label: "SMS", icon: MessageSquareText },
  pic: { label: "Landing site", icon: UserCheck },
};

export function SourceLabel({ source }: { source: CatchSource }) {
  const { label, icon: Icon } = SOURCE_META[source];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

export function isAiAssisted(code: string) {
  return isFlagReason(code) && FLAG_REASONS[code].aiAssisted;
}

export function AiAssistedTag({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 rounded bg-secondary px-1 py-px text-[10px] font-medium uppercase tracking-wide text-secondary-foreground", className)}
      title="Rule-based check that looks for unusual patterns"
    >
      <Sparkles className="size-2.5" aria-hidden />
      AI-assisted
    </span>
  );
}

/** First flag reason in plain words, plus a count of the rest. */
export function FlagSummary({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return <span className="text-sm text-muted-foreground">None</span>;
  const [first, ...rest] = reasons;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
      <span className="max-w-full truncate" title={reasons.map(flagLabel).join(", ")}>
        {flagLabel(first)}
      </span>
      {isAiAssisted(first) && <AiAssistedTag />}
      {rest.length > 0 && <span className="shrink-0 text-xs text-muted-foreground">+{rest.length} more</span>}
    </span>
  );
}
