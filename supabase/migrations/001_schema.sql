-- =============================================================================
-- Huli Ko — 001_schema.sql
-- Tables, enums, indexes. Run first.
-- =============================================================================

create extension if not exists postgis  with schema extensions;
create extension if not exists pgcrypto with schema extensions;

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role      as enum ('fisher', 'pic', 'admin');
create type public.zone_type      as enum ('restricted', 'safe', 'sanctuary', 'pollution');
-- Sanctuaries are no-take, so a catch inside one gets zone_status 'restricted'.
create type public.zone_status    as enum ('ok', 'restricted', 'pollution');
create type public.catch_source   as enum ('app', 'sms', 'pic');
create type public.catch_status   as enum ('verified', 'flagged', 'pending', 'reviewed');
create type public.report_type    as enum ('illegal_fishing', 'destructive_fishing', 'commercial_intrusion',
                                           'pollution', 'habitat_damage', 'other');
create type public.report_status  as enum ('received', 'investigating', 'resolved');
create type public.reef_condition as enum ('good', 'fair', 'poor');

-- -----------------------------------------------------------------------------
-- Reference: municipalities of Marinduque (real place names, not sample data)
-- -----------------------------------------------------------------------------
create table public.municipalities (
  name       text primary key,
  sort_order smallint not null
);

insert into public.municipalities (name, sort_order) values
  ('Boac', 1), ('Mogpog', 2), ('Gasan', 3), ('Buenavista', 4), ('Torrijos', 5), ('Santa Cruz', 6);

-- -----------------------------------------------------------------------------
-- profiles: one row per auth user (created by trigger in 002)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  role           public.user_role not null default 'fisher',
  full_name      text not null default '',
  municipality   text references public.municipalities (name) on update cascade,
  barangay       text,
  phone          text unique,          -- E.164, e.g. +639171234567; used to match SMS logs
  fishr_no       text unique,          -- BFAR FishR registration number
  license_expiry date,
  created_at     timestamptz not null default now()
);

create index profiles_role_idx         on public.profiles (role);
create index profiles_municipality_idx on public.profiles (municipality);

-- -----------------------------------------------------------------------------
-- boats (BoatR)
-- -----------------------------------------------------------------------------
create table public.boats (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  boatr_no      text unique,
  name          text not null,
  gross_tons    numeric(6, 2) check (gross_tons > 0),
  registered_at date,
  created_at    timestamptz not null default now()
);

create index boats_owner_idx on public.boats (owner_id);

-- -----------------------------------------------------------------------------
-- zones: management areas drawn by admins
-- -----------------------------------------------------------------------------
create table public.zones (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       public.zone_type not null,
  reason     text,
  geom       geography(Polygon, 4326) not null,
  active     boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index zones_geom_idx   on public.zones using gist (geom);
create index zones_active_idx on public.zones (active, type);

-- -----------------------------------------------------------------------------
-- species
-- Closed seasons repeat every year: only month and day are compared (see in_closed_season).
-- -----------------------------------------------------------------------------
create table public.species (
  id                  uuid primary key default gen_random_uuid(),
  local_name          text not null unique,
  english_name        text not null,
  scientific_name     text,
  min_legal_size_cm   numeric(6, 1) check (min_legal_size_cm > 0),
  closed_season_start date,
  closed_season_end   date,
  check ((closed_season_start is null) = (closed_season_end is null))
);

-- -----------------------------------------------------------------------------
-- catches
-- zone_status, status, flag_reasons, zone_id and qr_token are set by trigger (002).
-- -----------------------------------------------------------------------------
create table public.catches (
  id                uuid primary key default gen_random_uuid(),
  client_uuid       uuid unique,      -- generated on device; makes offline sync idempotent
  fisher_id         uuid not null references public.profiles (id) on delete restrict,
  logged_by         uuid references public.profiles (id) on delete set null,
  boat_id           uuid references public.boats (id) on delete set null,
  species_id        uuid not null references public.species (id),
  weight_kg         numeric(8, 2) not null check (weight_kg > 0 and weight_kg <= 5000),
  size_cm           numeric(6, 1) check (size_cm > 0),
  geom              geography(Point, 4326),   -- null when logged by SMS without location
  caught_at         timestamptz not null default now(),
  logged_at         timestamptz not null default now(),
  source            public.catch_source not null default 'app',
  zone_status       public.zone_status not null default 'ok',
  zone_id           uuid references public.zones (id) on delete set null,
  status            public.catch_status not null default 'pending',
  flag_reasons      text[] not null default '{}',
  late_entry_reason text,
  qr_token          text not null unique,
  photo_url         text,
  admin_note        text,
  reviewed_by       uuid references public.profiles (id) on delete set null,
  reviewed_at       timestamptz,
  check (caught_at <= logged_at + interval '1 hour')
);

create index catches_fisher_idx    on public.catches (fisher_id);
create index catches_species_idx   on public.catches (species_id);
create index catches_caught_at_idx on public.catches (caught_at desc);
create index catches_status_idx    on public.catches (status);
create index catches_zone_idx      on public.catches (zone_id);
create index catches_geom_idx      on public.catches using gist (geom);

-- -----------------------------------------------------------------------------
-- reports: community reports of illegal fishing, pollution, etc.
-- -----------------------------------------------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,  -- null = anonymous / hotline
  type        public.report_type not null,
  description text not null,
  geom        geography(Point, 4326),
  photo_url   text,
  status      public.report_status not null default 'received',
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at desc);
create index reports_geom_idx   on public.reports using gist (geom);

-- -----------------------------------------------------------------------------
-- spots_gallery: community photos of reefs and fishing spots
-- -----------------------------------------------------------------------------
create table public.spots_gallery (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  title          text not null,
  photo_url      text,
  geom           geography(Point, 4326),
  reef_condition public.reef_condition,
  approved       boolean not null default false,
  created_at     timestamptz not null default now()
);

create index spots_gallery_approved_idx on public.spots_gallery (approved, created_at desc);
