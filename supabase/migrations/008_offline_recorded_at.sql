-- =============================================================================
-- Huli Ko — 008_offline_recorded_at.sql (approved for the mobile offline-first phase)
--
-- WHY: the catch trigger sets logged_at = now() for every signed-in non-admin insert, and
-- evaluate_catch() flags "late_entry" when logged_at - caught_at > 48 h without a reason.
-- With offline-first logging, a fisher who saves a catch on the phone at sea and only gets
-- signal 3 days later would be flagged as a late entry, although they logged on time.
-- That penalises being offline, which the mobile brief rules out.
--
-- FIX: store when the DEVICE saved the log (recorded_at) and use it for the late-entry check,
-- clamped so it can never be before caught_at or after the server's logged_at, and ignored
-- if it claims to be more than 7 days older than the server time (a phone offline that long
-- is unusual; then the normal late-entry rule applies and the fisher can give a reason).
-- logged_at keeps meaning "when the server received it". Nothing else changes.
-- =============================================================================

set search_path = public, extensions;

alter table public.catches add column if not exists recorded_at timestamptz;
comment on column public.catches.recorded_at is
  'When the device saved the log (offline-first). Used only for the late-entry check, clamped to [caught_at, logged_at] and trusted for at most 7 days.';

-- Log time used for the late-entry check.
create or replace function public.effective_logged_at(p_caught timestamptz, p_recorded timestamptz, p_logged timestamptz)
returns timestamptz
language sql immutable
as $$
  select case
    when p_recorded is null or p_logged - p_recorded > interval '7 days' then p_logged
    else least(p_logged, greatest(p_caught, p_recorded))
  end
$$;

-- Same as 002 except the time passed to evaluate_catch().
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
    new.geom, new.caught_at,
    public.effective_logged_at(new.caught_at, new.recorded_at, new.logged_at),   -- changed
    new.late_entry_reason);

  new.zone_status  := v.zone_status;
  new.zone_id      := v.zone_id;
  new.flag_reasons := v.flag_reasons;
  new.status := case
    when cardinality(v.flag_reasons) > 0 then 'flagged'
    when new.geom is null then 'pending'
    else 'verified'
  end::public.catch_status;

  return new;
end;
$$;

-- Same as 002 except: recorded_at cannot be changed after insert, and re-checks use the effective time.
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
  new.recorded_at := old.recorded_at;                                              -- added

  if auth.uid() is not null and not public.is_admin() then
    new.fisher_id   := old.fisher_id;
    new.logged_by   := old.logged_by;
    new.status      := old.status;
    new.admin_note  := old.admin_note;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
  end if;

  if (new.species_id, new.weight_kg, new.size_cm, new.caught_at, new.boat_id, new.late_entry_reason)
       is distinct from
     (old.species_id, old.weight_kg, old.size_cm, old.caught_at, old.boat_id, old.late_entry_reason)
     or st_asbinary(new.geom) is distinct from st_asbinary(old.geom) then
    select * into v from public.evaluate_catch(
      new.id, new.fisher_id, new.boat_id, new.species_id, new.weight_kg, new.size_cm,
      new.geom, new.caught_at,
      public.effective_logged_at(new.caught_at, new.recorded_at, new.logged_at),  -- changed
      new.late_entry_reason);

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

-- catch_details gains recorded_at so admins can see device time vs server time.
-- (Views cannot add a column in the middle with CREATE OR REPLACE, so it is appended last.)
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
  b.name as boat_name, b.boatr_no, b.gross_tons,
  c.recorded_at
from public.catches c
join public.species  s on s.id = c.species_id
join public.profiles p on p.id = c.fisher_id
left join public.boats b on b.id = c.boat_id
left join public.zones z on z.id = c.zone_id;
