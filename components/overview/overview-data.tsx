import { Fish, Flag, Siren, Users } from "lucide-react";
import { ChartCard, DataTable } from "@/components/charts/chart-card";
import { RankedBarChart } from "@/components/charts/ranked-bar-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { EmptyState, ErrorState } from "@/components/data/states";
import { percentChange, type OverviewFilters, type OverviewStats } from "@/lib/analytics/overview";
import { formatDayLong, formatDayShort, formatKg, formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { KpiTile } from "./kpi-tile";
import { StatusBreakdown } from "./status-breakdown";

export async function OverviewData({ filters }: { filters: OverviewFilters }) {
  const { data, error } = await createClient().rpc("overview_stats", {
    p_from: filters.from,
    p_to: filters.to,
    ...(filters.municipality ? { p_municipality: filters.municipality } : {}),
  });

  if (error || !data) {
    return <ErrorState title="Could not load the overview" description={error?.message ?? "The database returned no data."} />;
  }

  return <OverviewView stats={data as unknown as OverviewStats} filters={filters} />;
}

export function OverviewView({ stats, filters }: { stats: OverviewStats; filters: OverviewFilters }) {
  const { kpis, range } = stats;
  const compare = `vs previous ${range.days} days`;
  const where = filters.municipality ?? "all municipalities";

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {formatDayLong(range.from)} to {formatDayLong(range.to)}, {where}. Compared with {formatDayShort(range.prev_from)} to{" "}
        {formatDayShort(range.prev_to)}.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Total catch"
          icon={Fish}
          value={formatNumber(kpis.total_kg)}
          unit="kg"
          change={percentChange(kpis.total_kg, kpis.total_kg_prev)}
          comparisonLabel={compare}
          footnote={`${formatNumber(kpis.logs)} catch logs`}
        />
        <KpiTile
          label="Active fishers"
          icon={Users}
          value={formatNumber(kpis.active_fishers)}
          change={percentChange(kpis.active_fishers, kpis.active_fishers_prev)}
          goodDirection="up"
          comparisonLabel={compare}
          footnote={`of ${formatNumber(kpis.registered_fishers)} registered fishers logged a catch`}
        />
        <KpiTile
          label="Flagged for review"
          icon={Flag}
          value={formatNumber(kpis.flagged)}
          change={percentChange(kpis.flagged, kpis.flagged_prev)}
          goodDirection="down"
          comparisonLabel={compare}
          footnote="Logs still waiting for a review"
        />
        <KpiTile
          label="Open reports"
          icon={Siren}
          value={formatNumber(kpis.open_reports)}
          footnote={`Received or investigating, all municipalities. ${formatNumber(kpis.new_reports)} new in this period.`}
        />
      </div>

      {kpis.logs === 0 ? (
        <EmptyState
          icon={Fish}
          title="No catches logged in this period"
          description="Try a longer date range or a different municipality."
        />
      ) : (
        <>
          <ChartCard
            title="Catch trend"
            description="Total catch weight per day (kg)"
            table={
              <DataTable
                columns={[{ label: "Date" }, { label: "Catch (kg)", numeric: true }, { label: "Logs", numeric: true }]}
                rows={stats.by_day.map((d) => [formatDayLong(d.day), formatNumber(d.kg, 1), d.logs])}
              />
            }
          >
            <TrendChart points={stats.by_day} />
          </ChartCard>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <ChartCard
              title="Catch by species"
              description="Total weight per species, largest first"
              table={
                <DataTable
                  columns={[{ label: "Species" }, { label: "English name" }, { label: "Catch (kg)", numeric: true }, { label: "Logs", numeric: true }]}
                  rows={stats.by_species.map((s) => [s.species, s.english, formatNumber(s.kg, 1), s.logs])}
                />
              }
            >
              <RankedBarChart rows={stats.by_species.map((s) => ({ label: s.species, sublabel: s.english, kg: s.kg, logs: s.logs }))} />
            </ChartCard>

            <div className="space-y-4">
              <StatusBreakdown counts={stats.by_status} total={kpis.logs} municipality={filters.municipality} />
              {!filters.municipality && (
                <ChartCard
                  title="Catch by municipality"
                  description="Total weight by the fisher's home municipality"
                  table={
                    <DataTable
                      columns={[{ label: "Municipality" }, { label: "Catch (kg)", numeric: true }, { label: "Logs", numeric: true }]}
                      rows={stats.by_municipality.map((m) => [m.municipality, formatKg(m.kg), m.logs])}
                    />
                  }
                >
                  <RankedBarChart
                    labelWidth={88}
                    rows={[...stats.by_municipality].sort((a, b) => b.kg - a.kg).map((m) => ({ label: m.municipality, kg: m.kg, logs: m.logs }))}
                  />
                </ChartCard>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
