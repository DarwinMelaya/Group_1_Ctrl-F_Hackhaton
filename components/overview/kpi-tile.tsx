import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type KpiTileProps = {
  label: string;
  icon: LucideIcon;
  value: string;
  unit?: string;
  /** Percent change vs the previous period; null = nothing to compare. */
  change?: number | null;
  /** Which direction is good. "neutral" keeps the delta in muted ink (e.g. catch weight). */
  goodDirection?: "up" | "down" | "neutral";
  comparisonLabel?: string;
  footnote?: string;
};

export function KpiTile({ label, icon: Icon, value, unit, change, goodDirection = "neutral", comparisonLabel, footnote }: KpiTileProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular">
        {value}
        {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
      </p>
      {change !== undefined && <Delta change={change} goodDirection={goodDirection} comparisonLabel={comparisonLabel} />}
      {footnote && <p className="text-xs text-muted-foreground">{footnote}</p>}
    </div>
  );
}

function Delta({ change, goodDirection, comparisonLabel }: { change: number | null; goodDirection: KpiTileProps["goodDirection"]; comparisonLabel?: string }) {
  if (change === null) {
    return <p className="text-xs text-muted-foreground">No data in the previous period to compare</p>;
  }
  const flat = Math.abs(change) < 0.5;
  const up = change > 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const tone =
    flat || goodDirection === "neutral"
      ? "text-muted-foreground"
      : (up && goodDirection === "up") || (!up && goodDirection === "down")
        ? "text-teal"
        : "text-coral";

  return (
    <p className="flex items-center gap-1 text-xs">
      <span className={cn("inline-flex items-center gap-0.5 font-medium tabular", tone)}>
        <Icon className="size-3.5" aria-hidden />
        {flat ? "No change" : `${up ? "Up" : "Down"} ${formatPercent(Math.abs(change))}`}
      </span>
      {comparisonLabel && <span className="text-muted-foreground">{comparisonLabel}</span>}
    </p>
  );
}
