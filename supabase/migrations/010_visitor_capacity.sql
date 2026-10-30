-- =============================================================================
-- MarAIne — 010_visitor_capacity.sql
--
-- WHY
-- Sustainable marine tourism: each coastal site can have a visitor capacity, a time limit
-- per visit, opening hours and a fee. No official figures for Marinduque sites were found
-- online, so every limit starts EMPTY and is set by an admin (MAO / MENRO / tourism office)
-- from the barangay or municipal rule, with its source. The app shows "No official limit
-- set yet" until then. Nothing here is invented.
--
-- Visitors check in on the app ("I'm here") and check out when they leave. The live count
-- per site is the number of open visits. A visit that is never closed stops counting after
-- the site's time limit (or 6 hours when there is none), so forgotten check-outs do not
-- block a site.
--
-- Tourists may use the app without an account, so check-in goes through narrow
-- SECURITY DEFINER functions keyed by a random device id. Nobody can list visits or see
-- who visited; the public only gets per-site counts.
-- =============================================================================

set search_path = public, extensions;

create table if not exists public.site_rules (
  place_id          text primary key,          -- matches the id in the app (onboarding/src/constants/places.ts)
  name              text not null,
  municipality      text not null,
  capacity          integer check (capacity is null or capacity > 0),             -- people on site at one time
  max_stay_minutes  integer check (max_stay_minutes is null or max_stay_minutes between 15 and 1440),
  open_from         time,
  open_to           time,
  fee_php           numeric(8, 2) check (fee_php is null or fee_php >= 0),
  notes             text,                      -- e.g. "Reachable at low tide only"
  source            text,                      -- where the rule comes from (ordinance no., barangay, tourism office)
  updated_by        uuid references auth.users (id),
  updated_at        timestamptz not null default now()
);

create table if not exists public.site_visits (
  id                uuid primary key default gen_random_uuid(),
  place_id          text not null references public.site_rules (place_id) on delete cascade,
  device_id         text not null check (length(device_id) between 16 and 64),
  user_id           uuid references auth.users (id),
  party_size        integer not null default 1 check (party_size between 1 and 50),
  checked_in_at     timestamptz not null default now(),
  checked_out_at    timestamptz
);

create index if not exists site_visits_open_idx on public.site_visits (place_id) where checked_out_at is null;
create index if not exists site_visits_device_idx on public.site_visits (device_id) where checked_out_at is null;

alter table public.site_rules enable row level security;
alter table public.site_visits enable row level security;

drop policy if exists site_rules_read on public.site_rules;
create policy site_rules_read on public.site_rules for select using (true);

drop policy if exists site_rules_admin_write on public.site_rules;
create policy site_rules_admin_write on public.site_rules for all
  using (public.is_admin()) with check (public.is_admin());

-- site_visits: no direct access for anyone but admins. The app uses the functions below.
drop policy if exists site_visits_admin_read on public.site_visits;
create policy site_visits_admin_read on public.site_visits for select using (public.is_admin());

-- The sites, with every limit left empty for the MAO to fill in.
insert into public.site_rules (place_id, name, municipality, notes) values
  ('maniwaya',  'Maniwaya Island',             'Santa Cruz', null),
  ('palad',     'Palad Sandbar',               'Santa Cruz', 'Reachable at low tide only.'),
  ('mongpong',  'Mongpong Island',             'Santa Cruz', null),
  ('salomague', 'Salomague Island',            'Santa Cruz', null),
  ('buyabod',   'Buyabod Port',                'Santa Cruz', null),
  ('gaspar',    'Gaspar Island (Tres Reyes)',  'Gasan',      null),
  ('melchor',   'Melchor Island (Tres Reyes)', 'Gasan',      null),
  ('baltasar',  'Baltasar Island (Tres Reyes)','Gasan',      null),
  ('poctoy',    'Poctoy White Beach',          'Torrijos',   null)
on conflict (place_id) do nothing;

-- An open visit still counts while it is younger than the site's time limit (or 6 hours).
create or replace function public.site_visit_is_live(v public.site_visits, r public.site_rules)
returns boolean language sql stable as $$
  select v.checked_out_at is null
     and v.checked_in_at > now() - make_interval(mins => coalesce(r.max_stay_minutes, 360));
$$;

-- People on each site right now, with its rules. Public: counts only.
create or replace function public.site_status()
returns table (
  place_id text, capacity integer, max_stay_minutes integer, open_from time, open_to time,
  fee_php numeric, notes text, source text, visitors_now integer
)
language sql stable security definer set search_path = public as $$
  select r.place_id, r.capacity, r.max_stay_minutes, r.open_from, r.open_to, r.fee_php, r.notes, r.source,
         coalesce((select sum(v.party_size)::integer from public.site_visits v
                    where v.place_id = r.place_id and public.site_visit_is_live(v, r)), 0)
    from public.site_rules r;
$$;

-- Check in. Refused when the site is full or closed. One open visit per device: checking in
-- somewhere else closes the previous one.
create or replace function public.site_check_in(p_place_id text, p_device_id text, p_party_size integer default 1)
returns table (visit_id uuid, ends_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  r public.site_rules;
  now_count integer;
  local_time time := (now() at time zone 'Asia/Manila')::time;
begin
  select * into r from public.site_rules where place_id = p_place_id;
  if not found then raise exception 'unknown_site' using errcode = 'P0001'; end if;
  if p_device_id is null or length(p_device_id) not between 16 and 64 then
    raise exception 'bad_device' using errcode = 'P0001';
  end if;
  if p_party_size is null or p_party_size not between 1 and 50 then
    raise exception 'bad_party_size' using errcode = 'P0001';
  end if;
  if r.open_from is not null and r.open_to is not null and not (local_time between r.open_from and r.open_to) then
    raise exception 'closed' using errcode = 'P0001';
  end if;

  update public.site_visits set checked_out_at = now()
   where device_id = p_device_id and checked_out_at is null;

  if r.capacity is not null then
    select coalesce(sum(v.party_size), 0) into now_count
      from public.site_visits v where v.place_id = r.place_id and public.site_visit_is_live(v, r);
    if now_count + p_party_size > r.capacity then
      raise exception 'full' using errcode = 'P0001';
    end if;
  end if;

  return query
  insert into public.site_visits (place_id, device_id, user_id, party_size)
  values (p_place_id, p_device_id, auth.uid(), p_party_size)
  returning id, case when r.max_stay_minutes is null then null
                     else checked_in_at + make_interval(mins => r.max_stay_minutes) end;
end;
$$;

-- Check out. Only the device that checked in can close its visit.
create or replace function public.site_check_out(p_visit_id uuid, p_device_id text)
returns void language sql security definer set search_path = public as $$
  update public.site_visits set checked_out_at = now()
   where id = p_visit_id and device_id = p_device_id and checked_out_at is null;
$$;

revoke all on function public.site_check_in(text, text, integer) from public;
revoke all on function public.site_check_out(uuid, text) from public;
grant execute on function public.site_status() to anon, authenticated;
grant execute on function public.site_check_in(text, text, integer) to anon, authenticated;
grant execute on function public.site_check_out(uuid, text) to anon, authenticated;
