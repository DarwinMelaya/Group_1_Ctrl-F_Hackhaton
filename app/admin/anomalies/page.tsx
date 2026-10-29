import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { CatchStatusBadge } from "@/components/catch/catch-status";
import { EmptyState, ErrorState } from "@/components/data/states";
import { addDays, todayInManila } from "@/lib/analytics/overview";
import { ANOMALY_ORDER, ANOMALY_RULES, evidence, type AnomalyCode } from "@/lib/anomalies/rules";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "AI-assisted checks" };

const PERIODS = [30, 60, 90] as const;

type Params = { days?: string; rule?: string; open?: string };

export default async function AnomaliesPage({ searchParams }: { searchParams: Params }) {
  const days = PERIODS.find((d) => String(d) === searchParams.days) ?? 60;
  const rule = (ANOMALY_ORDER as string[]).includes(searchParams.rule ?? "") ? (searchParams.rule as AnomalyCode) : null;
  const onlyOpen = searchParams.open !== "all";
  const today = todayInManila();

  const { data, error } = await createClient().rpc("anomaly_review", { p_from: addDays(today, -(days - 1)), p_to: today });

  const header = (
    <PageHeader
      title="AI-assisted checks"
      description="Rule-based checks that look for unusual patterns in catch logs. They use plain, published rules (no machine learning) and never decide anything: they only put a log up for review."
    />
  );
  if (error) {
    return (
      <>
        {header}
        <ErrorState title="Could not load the checks" description={error.message} />
      </>
    );
  }

  const all = data ?? [];
  const scoped = onlyOpen ? all.filter((r) => r.status === "flagged") : all;
  const rows = rule ? scoped.filter((r) => r.rule === rule) : scoped;
  const count = (code: AnomalyCode) => scoped.filter((r) => r.rule === code).length;

  const href = (update: Partial<Params>) => {
    const merged: Params = { days: days === 60 ? undefined : String(days), rule: rule ?? undefined, open: onlyOpen ? undefined : "all", ...update };
    const p = new URLSearchParams(Object.entries(merged).filter(([, v]) => v) as [string, string][]);
    return `/admin/anomalies${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      {header}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <nav aria-label="Period" className="flex rounded-md border bg-card p-0.5">
          {PERIODS.map((d) => (
            <Link
              key={d}
              href={href({ days: d === 60 ? undefined : String(d) })}
              scroll={false}
              aria-current={days === d ? "page" : undefined}
              className={cn("rounded px-3 py-1.5 text-sm", days === d ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              Last {d} days
            </Link>
          ))}
        </nav>
        <nav aria-label="Review status" className="flex rounded-md border bg-card p-0.5">
          <Link
            href={href({ open: undefined })}
            scroll={false}
            aria-current={onlyOpen ? "page" : undefined}
            className={cn("rounded px-3 py-1.5 text-sm", onlyOpen ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            Waiting for review
          </Link>
          <Link
            href={href({ open: "all" })}
            scroll={false}
            aria-current={!onlyOpen ? "page" : undefined}
            className={cn("rounded px-3 py-1.5 text-sm", !onlyOpen ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            Including reviewed
          </Link>
        </nav>
      </div>

      <ul className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ANOMALY_ORDER.map((code) => {
          const r = ANOMALY_RULES[code];
          const selected = rule === code;
          return (
            <li key={code}>
              <Link
                href={href({ rule: selected ? undefined : code })}
                scroll={false}
                aria-pressed={selected}
                className={cn(
                  "flex h-full flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "border-teal ring-1 ring-teal",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                    {r.kind === "Pattern" ? <Sparkles className="size-3" aria-hidden /> : <ShieldCheck className="size-3" aria-hidden />}
                    AI-assisted · {r.kind}
                  </span>
                  <span className="text-2xl font-semibold tabular">{count(code)}</span>
                </span>
                <span className="text-sm font-semibold">{r.title}</span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Rule: </span>
                  {r.rule}
                </span>
                <span className="text-xs text-muted-foreground">{r.why}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={onlyOpen ? "No logs waiting for review from these checks" : "No logs matched these checks"}
          description="Try a longer period, or include logs that were already reviewed."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <caption className="sr-only">Logs flagged by AI-assisted checks</caption>
            <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-left font-medium">Check</th>
                <th scope="col" className="px-3 py-2.5 text-left font-medium">Catch</th>
                <th scope="col" className="px-3 py-2.5 text-left font-medium">Why it was flagged</th>
                <th scope="col" className="px-3 py-2.5 text-left font-medium">Status</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={`${r.rule}-${r.catch_id}`} className="align-top">
                  <td className="px-3 py-2.5">
                    <span className="block min-w-40 font-medium">{ANOMALY_RULES[r.rule as AnomalyCode]?.title ?? r.rule}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="block min-w-44">
                      {r.species} · {Number(r.weight_kg)} kg
                      <span className="block text-xs text-muted-foreground">
                        {r.fisher_name}, {r.municipality} ·{" "}
                        {new Date(r.caught_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" })}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="block max-w-md">{evidence(r)}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <CatchStatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/admin/catches?q=${r.qr_token}&open=${r.catch_id}`}
                      prefetch={false}
                      className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-teal hover:underline"
                    >
                      Review <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Checks run in the database on every new log, from the app, SMS or a landing site. Distances use today&apos;s zone outlines. Flags are prompts to
        check, not findings. SAMPLE DATA.
      </p>
    </>
  );
}
