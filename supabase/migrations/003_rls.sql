-- =============================================================================
-- Huli Ko — 003_rls.sql
-- Row Level Security, public QR trace access, storage buckets and policies.
-- =============================================================================

set search_path = public, extensions;

alter table public.municipalities enable row level security;
alter table public.profiles       enable row level security;
alter table public.boats          enable row level security;
alter table public.zones          enable row level security;
alter table public.species        enable row level security;
alter table public.catches        enable row level security;
alter table public.reports        enable row level security;
alter table public.spots_gallery  enable row level security;

-- -----------------------------------------------------------------------------
-- Reference data: readable by any signed-in user, editable by admins
-- -----------------------------------------------------------------------------
create policy "municipalities: read" on public.municipalities
  for select to authenticated using (true);
create policy "municipalities: admin write" on public.municipalities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "species: read" on public.species
  for select to authenticated using (true);
create policy "species: admin write" on public.species
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "zones: read" on public.zones
  for select to authenticated using (true);
create policy "zones: admin write" on public.zones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- profiles
-- PIC (port/landing-site staff) can look up fishers to log catches for them.
-- -----------------------------------------------------------------------------
create policy "profiles: read own, admin all, pic reads fishers" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (public.my_role() = 'pic' and role = 'fisher')
  );

create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "profiles: admin insert" on public.profiles
  for insert to authenticated with check (public.is_admin());

create policy "profiles: admin delete" on public.profiles
  for delete to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- boats
-- -----------------------------------------------------------------------------
create policy "boats: read own, admin, pic" on public.boats
  for select to authenticated
  using (owner_id = auth.uid() or public.is_admin() or public.my_role() = 'pic');

create policy "boats: write own or admin" on public.boats
  for all to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- catches
-- Status, flags and QR token are always computed by triggers (002), whoever inserts.
-- -----------------------------------------------------------------------------
create policy "catches: read own or admin" on public.catches
  for select to authenticated
  using (fisher_id = auth.uid() or logged_by = auth.uid() or public.is_admin());

create policy "catches: fisher logs own, pic logs for any fisher, admin" on public.catches
  for insert to authenticated
  with check (
    public.is_admin()
    or (fisher_id = auth.uid() and logged_by = auth.uid())
    or (public.my_role() = 'pic' and logged_by = auth.uid() and source = 'pic')
  );

create policy "catches: update own or admin" on public.catches
  for update to authenticated
  using (fisher_id = auth.uid() or public.is_admin())
  with check (fisher_id = auth.uid() or public.is_admin());

create policy "catches: admin delete" on public.catches
  for delete to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- reports: anyone signed in can file one (optionally anonymous); only admins triage.
-- -----------------------------------------------------------------------------
create policy "reports: read own or admin" on public.reports
  for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy "reports: file new" on public.reports
  for insert to authenticated
  with check (
    public.is_admin()
    or ((reporter_id = auth.uid() or reporter_id is null)
        and status = 'received' and admin_note is null)
  );

create policy "reports: admin update" on public.reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "reports: admin delete" on public.reports
  for delete to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- spots_gallery: approved items are visible to everyone signed in.
-- Uploaders cannot approve their own items.
-- -----------------------------------------------------------------------------
create policy "gallery: read approved, own, or admin" on public.spots_gallery
  for select to authenticated
  using (approved or user_id = auth.uid() or public.is_admin());

create policy "gallery: upload own" on public.spots_gallery
  for insert to authenticated
  with check (public.is_admin() or (user_id = auth.uid() and approved = false));

create policy "gallery: edit own unapproved, admin all" on public.spots_gallery
  for update to authenticated
  using (public.is_admin() or (user_id = auth.uid() and approved = false))
  with check (public.is_admin() or (user_id = auth.uid() and approved = false));

create policy "gallery: delete own or admin" on public.spots_gallery
  for delete to authenticated using (public.is_admin() or user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Public QR trace
-- public_trace has no coordinates, no full name, no phone, no license data.
-- It is not readable directly; the public page calls get_trace(token), which
-- returns at most one row, so nobody can list every catch.
-- -----------------------------------------------------------------------------
create or replace view public.public_trace as
select
  c.qr_token,
  s.local_name                                   as species_local_name,
  s.english_name                                 as species_english_name,
  (c.caught_at at time zone 'Asia/Manila')::date as caught_on,
  nullif(split_part(btrim(p.full_name), ' ', 1), '') as fisher_first_name,
  p.municipality,
  c.status,
  (c.zone_status = 'pollution')                  as pollution_advisory,
  c.source
from public.catches c
join public.species  s on s.id = c.species_id
join public.profiles p on p.id = c.fisher_id;

revoke all on public.public_trace from anon, authenticated;

create or replace function public.get_trace(p_token text)
returns setof public.public_trace
language sql stable security definer
set search_path = public
as $$
  select * from public.public_trace where qr_token = p_token limit 1
$$;

-- -----------------------------------------------------------------------------
-- Function privileges
-- Supabase grants EXECUTE on new functions to anon/authenticated by default.
-- Internal checks stay private; the trigger functions run as their owner.
-- -----------------------------------------------------------------------------
revoke execute on function public.evaluate_catch(uuid, uuid, uuid, uuid, numeric, numeric,
  geography, timestamptz, timestamptz, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user()          from public, anon, authenticated;
revoke execute on function public.catches_before_insert()    from public, anon, authenticated;
revoke execute on function public.catches_before_update()    from public, anon, authenticated;
revoke execute on function public.profiles_protect_fields()  from public, anon, authenticated;

revoke execute on function public.get_trace(text) from public;
grant  execute on function public.get_trace(text) to anon, authenticated;

revoke execute on function public.upsert_zone(uuid, text, public.zone_type, text, boolean, jsonb) from public, anon;
grant  execute on function public.upsert_zone(uuid, text, public.zone_type, text, boolean, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Storage
-- Files are stored under "<user id>/<file name>".
--   catch-photos, report-photos: private; owner and admins read (admins via signed URLs).
--   gallery-photos: public read (moderation is enforced on the spots_gallery row).
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('catch-photos',   'catch-photos',   false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('report-photos',  'report-photos',  false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('gallery-photos', 'gallery-photos', true,  5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "photos: upload to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('catch-photos', 'report-photos', 'gallery-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos: read own or admin" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('catch-photos', 'report-photos', 'gallery-photos')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "photos: delete own or admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('catch-photos', 'report-photos', 'gallery-photos')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
