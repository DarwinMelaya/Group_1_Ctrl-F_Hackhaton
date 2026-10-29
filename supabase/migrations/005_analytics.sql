-- =============================================================================
-- Huli Ko — 005_analytics.sql
-- Aggregates for the dashboard Overview (and later the mobile app).
-- SECURITY INVOKER: RLS applies, so admins see every municipality and a fisher
-- calling it would only see their own catches.
-- Dates are calendar days in Asia/Manila.
-- =============================================================================

set search_path = public, extensions;

create or replace function public.overview_stats(
  p_from         date,
  p_to           date,
  p_municipality text default null
)
returns jsonb
language sql stable security invoker
set search_path = public, extensions
as $$
  with
  params as (
    select p_from as f, p_to as t, (p_to - p_from + 1) as span
  ),
  scoped as (
    select c.*, (c.caught_at at time zone 'Asia/Manila')::date as day
    from public.catch_details c
    where p_municipality is null or c.municipality = p_municipality
  ),
  cur  as (select s.* from scoped s, params p where s.day between p.f and p.t),
  prev as (select s.* from scoped s, params p where s.day between p.f - p.span and p.f - 1)
  select jsonb_build_object(
    'range', jsonb_build_object(
      'from', (select f from params), 'to', (select t from params),
      'prev_from', (select f - span from params), 'prev_to', (select f - 1 from params),
      'days', (select span from params)
    ),
    'kpis', jsonb_build_object(
      'total_kg',           (select coalesce(sum(weight_kg), 0) from cur),
      'total_kg_prev',      (select coalesce(sum(weight_kg), 0) from prev),
      'logs',               (select count(*) from cur),
      'logs_prev',          (select count(*) from prev),
      'active_fishers',     (select count(distinct fisher_id) from cur),
      'active_fishers_prev',(select count(distinct fisher_id) from prev),
      'registered_fishers', (select count(*) from public.profiles pr
                              where pr.role = 'fisher'
                                and (p_municipality is null or pr.municipality = p_municipality)),
      'flagged',            (select count(*) from cur  where status = 'flagged'),
      'flagged_prev',       (select count(*) from prev where status = 'flagged'),
      -- Reports have no municipality field; this count is always island-wide.
      'open_reports',       (select count(*) from public.reports r where r.status <> 'resolved'),
      'new_reports',        (select count(*) from public.reports r, params p
                              where (r.created_at at time zone 'Asia/Manila')::date between p.f and p.t)
    ),
    'by_species', coalesce((
      select jsonb_agg(jsonb_build_object(
               'species', species_local_name, 'english', species_english_name,
               'kg', kg, 'logs', logs) order by kg desc, species_local_name)
      from (select species_local_name, species_english_name, sum(weight_kg) as kg, count(*) as logs
            from cur group by 1, 2) s
    ), '[]'::jsonb),
    'by_day', (
      select jsonb_agg(jsonb_build_object('day', d::date, 'kg', coalesce(x.kg, 0), 'logs', coalesce(x.logs, 0)) order by d)
      from params p
      cross join generate_series(p.f, p.t, interval '1 day') as d
      left join (select day, sum(weight_kg) as kg, count(*) as logs from cur group by day) x on x.day = d::date
    ),
    'by_status', coalesce((
      select jsonb_object_agg(status, n) from (select status, count(*) as n from cur group by status) s
    ), '{}'::jsonb),
    'by_municipality', coalesce((
      select jsonb_agg(jsonb_build_object('municipality', m.name, 'kg', coalesce(x.kg, 0), 'logs', coalesce(x.logs, 0))
                       order by m.sort_order)
      from public.municipalities m
      left join (select municipality, sum(weight_kg) as kg, count(*) as logs from cur group by municipality) x
        on x.municipality = m.name
      where p_municipality is null or m.name = p_municipality
    ), '[]'::jsonb)
  )
$$;

revoke execute on function public.overview_stats(date, date, text) from public, anon;
grant  execute on function public.overview_stats(date, date, text) to authenticated;
