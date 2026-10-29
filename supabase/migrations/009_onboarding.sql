-- =============================================================================
-- Huli Ko — 009_onboarding.sql (approved for the onboarding phase)
--
-- WHY
-- 1. onboarded_at: so a returning user never sees onboarding again, on any phone.
-- 2. preferred_language: store the language choice in the profile after sign-up.
-- 3. requested_role: the role card ("Mangingisda" / "Taga-record (PIC)") is a REQUEST.
--    The existing trigger correctly prevents users from setting their own role, because
--    'pic' can read every fisher's profile and log catches for anyone. An admin approves it.
-- 4. registration_submissions: FishR / BoatR / license expiry typed by the fisher are
--    self-reported. The existing trigger correctly stops users from writing fishr_no and
--    license_expiry on their profile (otherwise anyone could clear their own "license
--    expired" flag). Submissions wait here until the MAO verifies them.
-- 5. Phone at sign-up: profiles.phone is unique (it routes SMS logs). If the number is
--    already registered, sign-up must not fail; the number is left empty instead and the
--    app tells the user to see the MAO.
-- =============================================================================

set search_path = public, extensions;

alter table public.profiles
  add column if not exists onboarded_at       timestamptz,
  add column if not exists preferred_language text check (preferred_language in ('tl', 'en')),
  add column if not exists requested_role     public.user_role check (requested_role in ('fisher', 'pic'));

-- Users may set these three themselves; role, fishr_no and license_expiry stay protected
-- by profiles_protect_fields() from 002 (unchanged).

-- New auth user -> profile. Role is still always 'fisher'. Reads the onboarding choices from sign-up metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_phone text := public.normalize_ph_phone(nullif(new.raw_user_meta_data ->> 'phone', ''));
begin
  insert into public.profiles (id, full_name, phone, municipality, barangay, preferred_language, requested_role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when v_phone is not null and not exists (select 1 from public.profiles p where p.phone = v_phone) then v_phone end,
    (select m.name from public.municipalities m where m.name = new.raw_user_meta_data ->> 'municipality'),
    nullif(new.raw_user_meta_data ->> 'barangay', ''),
    case when new.raw_user_meta_data ->> 'language' in ('tl', 'en') then new.raw_user_meta_data ->> 'language' end,
    case when new.raw_user_meta_data ->> 'requested_role' in ('fisher', 'pic')
         then (new.raw_user_meta_data ->> 'requested_role')::public.user_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Self-reported registration numbers, verified by the MAO before they count.
create table if not exists public.registration_submissions (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  fishr_no       text,
  boatr_no       text,
  license_expiry date,
  status         text not null default 'submitted' check (status in ('submitted', 'verified', 'rejected')),
  admin_note     text,
  reviewed_by    uuid references public.profiles (id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  check (fishr_no is not null or boatr_no is not null or license_expiry is not null)
);

create index if not exists registration_submissions_profile_idx on public.registration_submissions (profile_id, created_at desc);

alter table public.registration_submissions enable row level security;

create policy "registration: submit own" on public.registration_submissions
  for insert to authenticated
  with check (profile_id = auth.uid() and status = 'submitted' and reviewed_by is null and admin_note is null);

create policy "registration: read own or admin" on public.registration_submissions
  for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());

create policy "registration: admin review" on public.registration_submissions
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "registration: admin delete" on public.registration_submissions
  for delete to authenticated
  using (public.is_admin());
