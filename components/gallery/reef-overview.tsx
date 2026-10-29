import { REEF_CONDITIONS, REEF_LABELS } from "@/lib/gallery/labels";
import { formatPercent } from "@/lib/format";
import type { ReefCondition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { REEF_STYLE } from "./reef-condition";

type Spot = { reefCondition: ReefCondition | null; area: string | null };

/** Share of rated spots by reef condition (one stacked bar), then counts by area. Status colors carry icons and words. */
export function ReefOverview({ spots }: { spots: Spot[] }) {
  const rated = spots.filter((s): s is Spot & { reefCondition: ReefCondition } => s.reefCondition !== null);
  const counts = Object.fromEntries(REEF_CONDITIONS.map((c) => [c, rated.filter((s) => s.reefCondition === c).length])) as Record<ReefCondition, number>;
  const areas = Array.from(new Set(rated.map((s) => s.area ?? "No location"))).sort();

  return (
    <section className="mb-6 grid gap-4 rounded-lg border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" aria-labelledby="reef-heading">
      <div className="space-y-3">
        <div>
          <h2 id="reef-heading" className="text-sm font-semibold">
            Reef condition
          </h2>
          <p className="text-xs text-muted-foreground">
            From {rated.length} rated {rated.length === 1 ? "photo" : "photos"}, public and waiting. Community observations, not a survey. SAMPLE DATA.
          </p>
        </div>
        {rated.length === 0 ? (
          <p className="text-sm text-muted-foreground">No photos have a reef condition yet.</p>
        ) : (
          <>
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={REEF_CONDITIONS.map((c) => `${REEF_LABELS[c].label} ${counts[c]}`).join(", ")}>
              {REEF_CONDITIONS.filter((c) => counts[c] > 0).map((c) => (
                <span key={c} className={cn("h-full first:rounded-l-full last:rounded-r-full", REEF_STYLE[c].bar)} style={{ width: `${(counts[c] / rated.length) * 100}%` }} />
              ))}
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {REEF_CONDITIONS.map((c) => {
                const Icon = REEF_STYLE[c].icon;
                return (
                  <li key={c} className="space-y-0.5">
                    <p className="flex items-center gap-1.5 text-sm">
                      <span className={cn("size-2.5 rounded-sm", REEF_STYLE[c].bar)} aria-hidden />
                      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                      {REEF_LABELS[c].label}
                    </p>
                    <p className="text-lg font-semibold tabular">
                      {counts[c]}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">{formatPercent((counts[c] / rated.length) * 100)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{REEF_LABELS[c].detail}</p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {rated.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="mb-2 text-left text-xs text-muted-foreground">By area</caption>
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th scope="col" className="py-1.5 text-left font-medium">
                  Area
                </th>
                {REEF_CONDITIONS.map((c) => (
                  <th key={c} scope="col" className="py-1.5 text-right font-medium">
                    {REEF_LABELS[c].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {areas.map((area) => (
                <tr key={area}>
                  <th scope="row" className="py-1.5 text-left font-normal">
                    {area}
                  </th>
                  {REEF_CONDITIONS.map((c) => {
                    const n = rated.filter((s) => (s.area ?? "No location") === area && s.reefCondition === c).length;
                    return (
                      <td key={c} className={cn("py-1.5 text-right tabular", n === 0 && "text-muted-foreground")}>
                        {n}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
