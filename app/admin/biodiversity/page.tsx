import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { BiodiversityView } from "@/components/biodiversity/biodiversity-view";
import { ErrorState } from "@/components/data/states";
import { addDays, todayInManila } from "@/lib/analytics/overview";
import { WINDOW_OPTIONS, computeSpeciesTrends, computeTrendCells, type WindowDays, type Windows } from "@/lib/analytics/biodiversity";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Biodiversity" };

const manilaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" });

export default async function BiodiversityPage({ searchParams }: { searchParams: { species?: string; window?: string } }) {
  const days: WindowDays = WINDOW_OPTIONS.find((d) => String(d) === searchParams.window) ?? 30;
  const today = todayInManila();
  const windows: Windows = {
    currentFrom: addDays(today, -(days - 1)),
    currentTo: today,
    previousFrom: addDays(today, -(2 * days - 1)),
    previousTo: addDays(today, -days),
    days,
  };

  const supabase = createClient();
  const { data: species, error: speciesError } = await supabase.from("species").select("id, local_name, english_name").order("local_name");
  const speciesId = species?.some((s) => s.id === searchParams.species) ? searchParams.species! : null;

  // Both periods, every species, with and without a location. Filtered for the map below.
  const { data: rows, error } = await supabase
    .from("catch_details")
    .select("lat, lng, weight_kg, caught_at, species_id, species_local_name, species_english_name")
    .gte("caught_at", `${windows.previousFrom}T00:00:00+08:00`)
    .limit(10000);

  const header = (
    <PageHeader
      title="Biodiversity"
      description="Where catch is holding up and where it is falling, by area. Each cell compares recent catch per day with the period before."
    />
  );

  if (error || speciesError) {
    return (
      <>
        {header}
        <ErrorState title="Could not load catch data" description={(error ?? speciesError)?.message} />
      </>
    );
  }

  const logs = (rows ?? []).map((r) => ({
    lat: r.lat,
    lng: r.lng,
    kg: Number(r.weight_kg),
    day: manilaDay.format(new Date(r.caught_at!)),
    speciesId: r.species_id!,
    species: r.species_local_name!,
    english: r.species_english_name!,
  }));
  const speciesTrends = computeSpeciesTrends(logs, windows);
  const { cells, heat } = computeTrendCells(
    logs
      .filter((l) => l.lat !== null && l.lng !== null && (!speciesId || l.speciesId === speciesId))
      .map((l) => ({ lat: l.lat!, lng: l.lng!, kg: l.kg, day: l.day })),
    windows,
  );

  return (
    <>
      {header}
      <BiodiversityView
        cells={cells}
        heat={heat}
        windows={windows}
        species={species ?? []}
        speciesId={speciesId}
        speciesTrends={speciesTrends}
      />
    </>
  );
}
