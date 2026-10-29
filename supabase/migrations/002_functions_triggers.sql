-- =============================================================================
-- Huli Ko — 002_functions_triggers.sql
-- Role helpers, new-user trigger, catch checking, GeoJSON helpers and read views.
-- =============================================================================

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so RLS policies on profiles can call them
-- without recursing into profiles' own policies.
-- -----------------------------------------------------------------------------
create or replace function public.my_role()
returns public.user_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- -----------------------------------------------------------------------------
-- New auth user -> profile. Role is always 'fisher'; only an admin can promote.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, municipality, barangay)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    (select m.name from public.municipalities m where m.name = new.raw_user_meta_data ->> 'municipality'),
    nullif(new.raw_user_meta_data ->> 'barangay', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Non-admins cannot change their own role, FishR number or license expiry.
create or replace function public.profiles_protect_fields()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role           := old.role;
    new.fishr_no       := old.fishr_no;
    new.license_expiry := old.license_expiry;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.profiles_protect_fields();

-- -----------------------------------------------------------------------------
-- Small helpers
-- -----------------------------------------------------------------------------

-- 12-character URL-safe token for QR codes.
create or replace function public.new_qr_token()
returns text
language sql volatile
set search_path = public, extensions
as $$
  select translate(encode(gen_random_bytes(9), 'base64'), '+/', '-_')
$$;

-- Annual closed season check. Only month-day is compared, so a season stored as
-- 2000-11-15 .. 2000-02-15 means "every year from 15 Nov to 15 Feb" (wraps the new year).
create or replace function public.in_closed_season(p_start date, p_end date, p_day date)
returns boolean
language sql immutable
as $$
  select case
    when p_start is null or p_end is null or p_day is null then false
    when to_char(p_start, 'MMDD') <= to_char(p_end, 'MMDD')
      then to_char(p_day, 'MMDD') between to_char(p_start, 'MMDD') and to_char(p_end, 'MMDD')
    else to_char(p_day, 'MMDD') >= to_char(p_start, 'MMDD')
      or to_char(p_day, 'MMDD') <= to_char(p_end, 'MMDD')
  end
$$;

-- -----------------------------------------------------------------------------
-- evaluate_catch: the single source of truth for catch checks.
--
-- Flag reason codes (mirrored in lib/catch/flags.ts):
--   restricted_zone      inside an active restricted zone
--   sanctuary            inside an active marine sanctuary
--   license_expired      fisher's license_expiry is before the catch date
--   license_missing      fisher has no license on record
--   closed_season        species is in its annual closed season on the catch date
--   undersized           size_cm below the species' minimum legal size
--   late_entry           logged more than 48 h after the catch with no reason given
--   anomaly_large_catch  [AI-assisted] weight above 100 kg per gross ton of the boat
--   anomaly_near_boundary[AI-assisted] 3rd+ log within 300 m of a restricted zone or
--                        sanctuary by the same fisher in 14 days
--
-- A catch inside a pollution zone gets zone_status 'pollution' but is not flagged:
-- it is a food-safety advisory, not a rule violation.
-- -----------------------------------------------------------------------------
create or replace function public.evaluate_catch(
  p_id                uuid,
  p_fisher_id         uuid,
  p_boat_id           uuid,
  p_species_id        uuid,
  p_weight_kg         numeric,
  p_size_cm           numeric,
  p_geom              geography,
  p_caught_at         timestamptz,
  p_logged_at         timestamptz,
  p_late_entry_reason text,
  out zone_status     public.zone_status,
  out zone_id         uuid,
  out flag_reasons    text[]
)
language plpgsql stable security definer
set search_path = public, extensions
as $$
declare
  c_late_after      constant interval := interval '48 hours';
  c_kg_per_ton      constant numeric  := 100;
  c_boundary_m      constant numeric  := 300;
  c_boundary_window constant interval := interval '14 days';
  c_boundary_prior  constant int      := 2;

  v_day        date := (p_caught_at at time zone 'Asia/Manila')::date;
  v_restricted uuid;
  v_sanctuary  uuid;
  v_pollution  uuid;
  v_expiry     date;
  v_species    public.species%rowtype;
  v_tons       numeric;
  v_near       int;
begin
  zone_status  := 'ok';
  flag_reasons := '{}';

  -- Zones
  if p_geom is not null then
    select
      (array_agg(z.id order by z.created_at) filter (where z.type = 'restricted'))[1],
      (array_agg(z.id order by z.created_at) filter (where z.type = 'sanctuary'))[1],
      (array_agg(z.id order by z.created_at) filter (where z.type = 'pollution'))[1]
    into v_restricted, v_sanctuary, v_pollution
    from public.zones z
    where z.active and st_intersects(z.geom, p_geom);

    if v_restricted is not null then
      flag_reasons := array_append(flag_reasons, 'restricted_zone');
    end if;
    if v_sanctuary is not null then
      flag_reasons := array_append(flag_reasons, 'sanctuary');
    end if;

    if v_restricted is not null or v_sanctuary is not null then
      zone_status := 'restricted';
      zone_id     := coalesce(v_restricted, v_sanctuary);
    elsif v_pollution is not null then
      zone_status := 'pollution';
      zone_id     := v_pollution;
    else
      select z.id into zone_id
      from public.zones z
      where z.active and z.type = 'safe' and st_intersects(z.geom, p_geom)
      order by z.created_at
      limit 1;
    end if;
  end if;

  -- License
  select p.license_expiry into v_expiry from public.profiles p where p.id = p_fisher_id;
  if v_expiry is null then
    flag_reasons := array_append(flag_reasons, 'license_missing');
  elsif v_expiry < v_day then
    flag_reasons := array_append(flag_reasons, 'license_expired');
  end if;

  -- Species rules
  select * into v_species from public.species s where s.id = p_species_id;
  if public.in_closed_season(v_species.closed_season_start, v_species.closed_season_end, v_day) then
    flag_reasons := array_append(flag_reasons, 'closed_season');
  end if;
  if p_size_cm is not null and v_species.min_legal_size_cm is not null
     and p_size_cm < v_species.min_legal_size_cm then
    flag_reasons := array_append(flag_reasons, 'undersized');
  end if;

  -- Late entry: never flagged when a reason is given.
  if p_logged_at - p_caught_at > c_late_after
     and nullif(btrim(coalesce(p_late_entry_reason, '')), '') is null then
    flag_reasons := array_append(flag_reasons, 'late_entry');
  end if;

  -- [AI-assisted] Unusually large catch for the boat's size.
  -- Uses the logged boat, else the fisher's largest registered boat.
  select coalesce(
           (select b.gross_tons from public.boats b where b.id = p_boat_id),
           (select max(b.gross_tons) from public.boats b where b.owner_id = p_fisher_id))
  into v_tons;
  if v_tons is not null and p_weight_kg > v_tons * c_kg_per_ton then
    flag_reasons := array_append(flag_reasons, 'anomaly_large_catch');
  end if;

  -- [AI-assisted] Repeated logs near a protected boundary (but not inside it).
  if p_geom is not null and v_restricted is null and v_sanctuary is null
     and exists (
       select 1 from public.zones z
       where z.active and z.type in ('restricted', 'sanctuary')
         and st_dwithin(z.geom, p_geom, c_boundary_m)
     ) then
    select count(distinct c.id) into v_near
    from public.catches c
    join public.zones z
      on z.active and z.type in ('restricted', 'sanctuary')
     and st_dwithin(z.geom, c.geom, c_boundary_m)
    where c.fisher_id = p_fisher_id
      and c.id is distinct from p_id
      and c.geom is not null
      and c.caught_at between p_caught_at - c_boundary_window and p_caught_at;

    if v_near >= c_boundary_prior then
      flag_reasons := array_append(flag_reasons, 'anomaly_near_boundary');
    end if;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Catch triggers
-- -----------------------------------------------------------------------------
create or replace function public.catches_before_insert()
returns trigger
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v record;
begin
  new.fisher_id := coalesce(new.fisher_id, auth.uid());
  new.logged_by := coalesce(new.logged_by, auth.uid(), new.fisher_id);

  -- Signed-in non-admins cannot backdate the log time or pre-fill review fields.
  -- (Seeds and the SMS webhook run without auth.uid() and may set logged_at.)
  if auth.uid() is not null and not public.is_admin() then
    new.logged_at   := now();
    new.admin_note  := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  new.logged_at := coalesce(new.logged_at, now());
  new.caught_at := coalesce(new.caught_at, new.logged_at);
  new.qr_token  := public.new_qr_token();

  select * into v from public.evaluate_catch(
    new.id, new.fisher_id, new.boat_id, new.species_id, new.weight_kg, new.size_cm,
    new.geom, new.caught_at, new.logged_at, new.late_entry_reason);

  new.zone_status  := v.zone_status;
  new.zone_id      := v.zone_id;
  new.flag_reasons := v.flag_reasons;
  new.status := case
    when cardinality(v.flag_reasons) > 0 then 'flagged'
    when new.geom is null then 'pending'   -- no location yet, cannot confirm the zone
    else 'verified'
  end::public.catch_status;

  return new;
end;
$$;

create trigger catches_before_insert
  before insert on public.catches
  for each row execute function public.catches_before_insert();

create or replace function public.catches_before_update()
returns trigger
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v record;
begin
  new.id          := old.id;
  new.qr_token    := old.qr_token;
  new.client_uuid := old.client_uuid;
  new.logged_at   := old.logged_at;

  if auth.uid() is not null and not public.is_admin() then
    new.fisher_id   := old.fisher_id;
    new.logged_by   := old.logged_by;
    new.status      := old.status;
    new.admin_note  := old.admin_note;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
  end if;

  -- Editing what was caught, where or when re-runs the checks and clears any review.
  if (new.species_id, new.weight_kg, new.size_cm, new.caught_at, new.boat_id, new.late_entry_reason)
       is distinct from
     (old.species_id, old.weight_kg, old.size_cm, old.caught_at, old.boat_id, old.late_entry_reason)
     or st_asbinary(new.geom) is distinct from st_asbinary(old.geom) then
    select * into v from public.evaluate_catch(
      new.id, new.fisher_id, new.boat_id, new.species_id, new.weight_kg, new.size_cm,
      new.geom, new.caught_at, new.logged_at, new.late_entry_reason);

    new.zone_status  := v.zone_status;
    new.zone_id      := v.zone_id;
    new.flag_reasons := v.flag_reasons;
    new.status := case
      when cardinality(v.flag_reasons) > 0 then 'flagged'
      when new.geom is null then 'pending'
      else 'verified'
    end::public.catch_status;
    new.reviewed_by := null;
    new.reviewed_at := null;
  elsif new.status is distinct from old.status and new.status in ('reviewed', 'verified') then
    new.reviewed_by := coalesce(auth.uid(), new.reviewed_by);
    new.reviewed_at := now();
  end if;

  return new;
end;
$$;

create trigger catches_before_update
  before update on public.catches
  for each row execute function public.catches_before_update();

-- updated_at bookkeeping
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger zones_touch   before update on public.zones   for each row execute function public.touch_updated_at();
create trigger reports_touch before update on public.reports for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Zone editing from GeoJSON (called by the admin map). Runs as the caller, so RLS applies.
-- p_id null = create. Returns the zone id.
-- -----------------------------------------------------------------------------
create or replace function public.upsert_zone(
  p_id      uuid,
  p_name    text,
  p_type    public.zone_type,
  p_reason  text,
  p_active  boolean,
  p_geojson jsonb
)
returns uuid
language plpgsql security invoker
set search_path = public, extensions
as $$
declare
  v_geom geometry := st_setsrid(st_geomfromgeojson(p_geojson::text), 4326);
  v_id   uuid;
begin
  if st_geometrytype(v_geom) <> 'ST_Polygon' then
    raise exception 'Zone must be a single polygon (got %)', st_geometrytype(v_geom);
  end if;
  if not st_isvalid(v_geom) then
    v_geom := st_makevalid(v_geom);
    if st_geometrytype(v_geom) <> 'ST_Polygon' then
      raise exception 'Zone outline crosses itself. Redraw it without overlapping edges.';
    end if;
  end if;

  if p_id is null then
    insert into public.zones (name, type, reason, active, geom, created_by)
    values (p_name, p_type, p_reason, coalesce(p_active, true), v_geom::geography, auth.uid())
    returning id into v_id;
  else
    update public.zones
       set name = p_name, type = p_type, reason = p_reason,
           active = coalesce(p_active, active), geom = v_geom::geography
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'Zone % not found or not editable', p_id;
    end if;
  end if;
  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Read views. security_invoker = true: the caller's RLS applies, so fishers see
-- only their own rows and admins see everything. Geography is exposed as
-- lat/lng or GeoJSON because PostgREST returns raw geography as hex WKB.
-- -----------------------------------------------------------------------------
create or replace view public.zones_geojson
with (security_invoker = true) as
select
  z.id, z.name, z.type, z.reason, z.active, z.created_by, z.created_at, z.updated_at,
  st_asgeojson(z.geom, 6)::jsonb    as geojson,
  round((st_area(z.geom) / 10000)::numeric, 2) as area_ha
from public.zones z;

create or replace view public.catch_details
with (security_invoker = true) as
select
  c.id, c.client_uuid, c.fisher_id, c.logged_by, c.boat_id, c.species_id,
  s.local_name   as species_local_name,
  s.english_name as species_english_name,
  c.weight_kg, c.size_cm,
  st_y(c.geom::geometry) as lat,
  st_x(c.geom::geometry) as lng,
  c.caught_at, c.logged_at, c.source, c.zone_status, c.zone_id,
  z.name as zone_name, z.type as zone_type,
  c.status, c.flag_reasons, c.late_entry_reason, c.qr_token, c.photo_url,
  c.admin_note, c.reviewed_by, c.reviewed_at,
  p.full_name as fisher_name, p.municipality, p.barangay, p.fishr_no,
  b.name as boat_name, b.boatr_no, b.gross_tons
from public.catches c
join public.species  s on s.id = c.species_id
join public.profiles p on p.id = c.fisher_id
left join public.boats b on b.id = c.boat_id
left join public.zones z on z.id = c.zone_id;

create or replace view public.report_details
with (security_invoker = true) as
select
  r.id, r.reporter_id, r.type, r.description, r.photo_url, r.status, r.admin_note,
  r.created_at, r.updated_at,
  st_y(r.geom::geometry) as lat,
  st_x(r.geom::geometry) as lng,
  p.full_name as reporter_name, p.municipality as reporter_municipality
from public.reports r
left join public.profiles p on p.id = r.reporter_id;

create or replace view public.gallery_details
with (security_invoker = true) as
select
  g.id, g.user_id, g.title, g.photo_url, g.reef_condition, g.approved, g.created_at,
  st_y(g.geom::geometry) as lat,
  st_x(g.geom::geometry) as lng,
  p.full_name as uploader_name, p.municipality as uploader_municipality
from public.spots_gallery g
join public.profiles p on p.id = g.user_id;
