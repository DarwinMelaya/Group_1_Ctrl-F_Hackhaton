-- =============================================================================
-- Huli Ko — 007_anomalies.sql
-- Evidence for the AI-assisted (rule-based) checks, so every flag can be explained.
-- Thresholds must match evaluate_catch() in 002 and ANOMALY_RULES in lib/anomalies/rules.ts:
--   anomaly_large_catch    weight > 100 kg per gross ton of the boat
--   anomaly_near_boundary  3rd+ log within 300 m of a restricted zone or sanctuary in 14 days
-- SECURITY INVOKER: RLS applies (admins see everything).
-- Distances use today's zone outlines, which may differ from when the log was checked.
-- =============================================================================

set search_path = public, extensions;

create or replace function public.anomaly_review(p_from date, p_to date)
returns table (
  catch_id        uuid,
  rule            text,
  caught_at       timestamptz,
  qr_token        text,
  status          public.catch_status,
  species         text,
  fisher_name     text,
  municipality    text,
  weight_kg       numeric,
  gross_tons      numeric,
  kg_per_ton      numeric,
  zone_name       text,
  distance_m      numeric,
  prior_logs      integer,
  season_start    date,
  season_end      date,
  license_expiry  date,
  days_expired    integer
)
language sql stable security invoker
set search_path = public, extensions
as $$
  with base as (
    select c.*, s.local_name as species_name, s.closed_season_start, s.closed_season_end,
           p.full_name, p.municipality as fisher_municipality, p.license_expiry as fisher_license_expiry,
           (c.caught_at at time zone 'Asia/Manila')::date as day
    from public.catches c
    join public.species s on s.id = c.species_id
    join public.profiles p on p.id = c.fisher_id
    where (c.caught_at at time zone 'Asia/Manila')::date between p_from and p_to
  )
  -- Unusually large catch for the boat's size
  select b.id, 'anomaly_large_catch', b.caught_at, b.qr_token, b.status, b.species_name, b.full_name, b.fisher_municipality,
         b.weight_kg, t.tons, round(b.weight_kg / nullif(t.tons, 0), 1),
         null::text, null::numeric, null::integer, null::date, null::date, null::date, null::integer
  from base b
  cross join lateral (
    select coalesce(
      (select bt.gross_tons from public.boats bt where bt.id = b.boat_id),
      (select max(bt.gross_tons) from public.boats bt where bt.owner_id = b.fisher_id)) as tons
  ) t
  where 'anomaly_large_catch' = any(b.flag_reasons)

  union all
  -- Repeated logs near a protected boundary
  select b.id, 'anomaly_near_boundary', b.caught_at, b.qr_token, b.status, b.species_name, b.full_name, b.fisher_municipality,
         b.weight_kg, null, null,
         nz.name, round(nz.dist::numeric), pr.n,
         null, null, null, null
  from base b
  left join lateral (
    select z.name, st_distance(z.geom, b.geom) as dist
    from public.zones z
    where z.active and z.type in ('restricted', 'sanctuary') and b.geom is not null
    order by z.geom <-> b.geom
    limit 1
  ) nz on true
  left join lateral (
    select count(distinct c2.id)::integer as n
    from public.catches c2
    join public.zones z on z.active and z.type in ('restricted', 'sanctuary') and st_dwithin(z.geom, c2.geom, 300)
    where c2.fisher_id = b.fisher_id and c2.id <> b.id and c2.geom is not null
      and c2.caught_at between b.caught_at - interval '14 days' and b.caught_at
  ) pr on true
  where 'anomaly_near_boundary' = any(b.flag_reasons)

  union all
  -- Species in its closed season
  select b.id, 'closed_season', b.caught_at, b.qr_token, b.status, b.species_name, b.full_name, b.fisher_municipality,
         b.weight_kg, null, null, null, null, null,
         b.closed_season_start, b.closed_season_end, null, null
  from base b
  where 'closed_season' = any(b.flag_reasons)

  union all
  -- License expired before the catch date
  select b.id, 'license_expired', b.caught_at, b.qr_token, b.status, b.species_name, b.full_name, b.fisher_municipality,
         b.weight_kg, null, null, null, null, null, null, null,
         b.fisher_license_expiry, (b.day - b.fisher_license_expiry)
  from base b
  where 'license_expired' = any(b.flag_reasons)

  order by 3 desc
$$;

revoke execute on function public.anomaly_review(date, date) from public, anon;
grant  execute on function public.anomaly_review(date, date) to authenticated;
