-- =============================================================================
-- Huli Ko — 004_seed.sql
--
--   ███  SAMPLE DATA — FOR DEMONSTRATION ONLY  ███
--
-- Place names and species are real. Everything else is fictional SAMPLE DATA:
-- people, phone numbers, FishR/BoatR numbers, boats, zone boundaries, legal sizes,
-- closed seasons, catches and reports. Zone outlines are illustrative and are not
-- official municipal ordinances or BFAR rules.
--
-- Safe to re-run: it removes previous sample rows first (sample users all have
-- emails ending in @sample.huliko.test). Must run as the postgres role
-- (SQL Editor or `supabase db push`) because it writes to auth.users.
-- Catch dates are relative to the moment you run it (last 60 days).
-- =============================================================================

set search_path = public, extensions;

drop table if exists _sample_people, _grounds, _species_mix, _gen;

-- -----------------------------------------------------------------------------
-- 0. Remove previous sample data
-- -----------------------------------------------------------------------------
delete from public.catches
 where fisher_id in (select id from auth.users where email like '%@sample.huliko.test');
delete from public.reports
 where id in (select md5('huliko-sample-report-' || g)::uuid from generate_series(1, 20) g);
delete from public.zones
 where id in (select md5('huliko-sample-zone-' || g)::uuid from generate_series(1, 10) g);
delete from auth.users where email like '%@sample.huliko.test';   -- cascades to profiles, boats, gallery

-- -----------------------------------------------------------------------------
-- 1. Species (real local and English names; SAMPLE legal sizes and closed seasons)
--    Closed season years are ignored; only month and day matter.
-- -----------------------------------------------------------------------------
insert into public.species (local_name, english_name, scientific_name, min_legal_size_cm, closed_season_start, closed_season_end) values
  ('Tulingan',       'Frigate tuna',      'Auxis thazard',             20.0, null,         null),
  ('Galunggong',     'Round scad',        'Decapterus macrosoma',      12.0, '2000-11-15', '2000-02-15'),
  ('Lapu-lapu',      'Grouper',           'Epinephelus spp.',          30.0, '2000-10-01', '2000-11-30'),
  ('Tanguige',       'Spanish mackerel',  'Scomberomorus commerson',   45.0, null,         null),
  ('Bangus',         'Milkfish',          'Chanos chanos',             25.0, null,         null),
  ('Pusit',          'Squid',             'Loligo spp.',                8.0, null,         null),
  ('Dalagang-bukid', 'Redbelly fusilier', 'Caesio cuning',             15.0, null,         null),
  ('Maya-maya',      'Red snapper',       'Lutjanus spp.',             25.0, null,         null),
  ('Talakitok',      'Trevally',          'Caranx spp.',               25.0, null,         null),
  ('Danggit',        'Rabbitfish',        'Siganus spp.',              12.0, null,         null)
on conflict (local_name) do update set
  english_name        = excluded.english_name,
  scientific_name     = excluded.scientific_name,
  min_legal_size_cm   = excluded.min_legal_size_cm,
  closed_season_start = excluded.closed_season_start,
  closed_season_end   = excluded.closed_season_end;

-- -----------------------------------------------------------------------------
-- 2. Sample users: 30 fishers (5 per municipality) + 2 PIC (landing-site staff)
--    They cannot log in (no password). Profiles are created by handle_new_user().
-- -----------------------------------------------------------------------------
create temp table _sample_people (
  n            int primary key,
  full_name    text,
  municipality text,
  barangay     text,
  role         public.user_role
);

insert into _sample_people values
  ( 1, 'Rodel Malabana',      'Boac',       'Laylay',      'fisher'),
  ( 2, 'Ernesto Lagran',      'Boac',       'Caganhao',    'fisher'),
  ( 3, 'Joel Mendoza',        'Boac',       'Cawit',       'fisher'),
  ( 4, 'Analyn Sadiwa',       'Boac',       'Bantad',      'fisher'),
  ( 5, 'Ramil Palomares',     'Boac',       'Laylay',      'fisher'),
  ( 6, 'Danilo Jamilla',      'Mogpog',     'Balanacan',   'fisher'),
  ( 7, 'Reynaldo Morales',    'Mogpog',     'Hinanggayon', 'fisher'),
  ( 8, 'Marites Lacdao',      'Mogpog',     'Silangan',    'fisher'),
  ( 9, 'Arnel Sotto',         'Mogpog',     'Balanacan',   'fisher'),
  (10, 'Jun Pastor',          'Mogpog',     'Argao',       'fisher'),
  (11, 'Nestor Leva',         'Gasan',      'Dawis',       'fisher'),
  (12, 'Romeo Pizarro',       'Gasan',      'Pinggan',     'fisher'),
  (13, 'Lorna Marquez',       'Gasan',      'Banot',       'fisher'),
  (14, 'Edwin Labay',         'Gasan',      'Bahi',        'fisher'),
  (15, 'Alvin Villaruel',     'Gasan',      'Tiguion',     'fisher'),
  (16, 'Roberto Saguid',      'Buenavista', 'Sihi',        'fisher'),
  (17, 'Carlito Madrigal',    'Buenavista', 'Bagacay',     'fisher'),
  (18, 'Evelyn Rejano',       'Buenavista', 'Yook',        'fisher'),
  (19, 'Jomar Lapitan',       'Buenavista', 'Lipata',      'fisher'),
  (20, 'Teodoro Magdaraog',   'Buenavista', 'Daykitin',    'fisher'),
  (21, 'Benjie Rocafort',     'Torrijos',   'Poctoy',      'fisher'),
  (22, 'Ferdinand Larga',     'Torrijos',   'Bonliw',      'fisher'),
  (23, 'Rosalie Manalo',      'Torrijos',   'Malibago',    'fisher'),
  (24, 'Gerry Lavega',        'Torrijos',   'Matuyatuya',  'fisher'),
  (25, 'Melchor Seño',        'Torrijos',   'Sibuyao',     'fisher'),
  (26, 'Ricardo Monterey',    'Santa Cruz', 'Maniwaya',    'fisher'),
  (27, 'Wilfredo Regencia',   'Santa Cruz', 'Mongpong',    'fisher'),
  (28, 'Jocelyn Palma',       'Santa Cruz', 'Polo',        'fisher'),
  (29, 'Manuel Rey Oriendo',  'Santa Cruz', 'Buyabod',     'fisher'),
  (30, 'Dante Morales',       'Santa Cruz', 'Ipil',        'fisher'),
  (31, 'Grace Livelo',        'Boac',       'Laylay',      'pic'),
  (32, 'Victor Sadiasa',      'Gasan',      'Dawis',       'pic');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  md5('huliko-sample-user-' || p.n)::uuid,
  'authenticated', 'authenticated',
  format('%s.%s@sample.huliko.test', p.role, lpad(p.n::text, 2, '0')),
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'full_name',    p.full_name,
    'municipality', p.municipality,
    'barangay',     p.barangay,
    'phone',        '+63900000' || lpad(p.n::text, 4, '0')   -- SAMPLE, not a real number
  ),
  now() - interval '400 days' + (p.n || ' days')::interval,
  now(), '', '', '', ''
from _sample_people p;

-- Roles, FishR numbers and license expiry.
-- Spread: 4 expired, 4 expiring within 30 days, 1 with no license on record, rest valid.
update public.profiles pr
   set role     = p.role,
       fishr_no = case when p.role = 'fisher'
                       then format('FR-MDQ-%s-2024-%s',
                                   upper(left(replace(p.municipality, ' ', ''), 3)),
                                   lpad(p.n::text, 4, '0'))
                  end,
       license_expiry = case
         when p.role <> 'fisher'           then null
         when p.n in (4, 13, 22, 28)       then current_date - (10 + p.n)        -- expired
         when p.n in (2, 9, 17, 26)        then current_date + (3 + p.n % 25)    -- expiring in 30 days
         when p.n = 19                     then null                             -- no license on record
         else current_date + (120 + p.n * 17)
       end
  from _sample_people p
 where pr.id = md5('huliko-sample-user-' || p.n)::uuid;

-- -----------------------------------------------------------------------------
-- 3. Boats: 20 small municipal boats (0.6–3.0 GT) (SAMPLE names and tonnage)
-- -----------------------------------------------------------------------------
insert into public.boats (id, owner_id, boatr_no, name, gross_tons, registered_at)
select
  md5('huliko-sample-boat-' || b.n)::uuid,
  md5('huliko-sample-user-' || b.owner_n)::uuid,
  format('BR-MDQ-2023-%s', lpad(b.n::text, 4, '0')),
  b.name, b.gt,
  current_date - (200 + b.n * 11)
from (values
  ( 1,  1, 'Biyaya ng Dagat', 1.20), ( 2,  3, 'Santo Niño',       0.80),
  ( 3,  5, 'Bagong Pag-asa',  2.50), ( 4,  6, 'Mutya ng Mogpog',  1.50),
  ( 5,  8, 'Tala',            0.60), ( 6, 10, 'Ligaya',           1.00),
  ( 7, 11, 'Mutya ng Gasan',  3.00), ( 8, 12, 'Dalisay',          1.10),
  ( 9, 14, 'Bituin',          0.90), (10, 15, 'Pag-asa II',       2.00),
  (11, 16, 'San Isidro',      1.30), (12, 18, 'Liwayway',         0.70),
  (13, 20, 'Amihan',          1.80), (14, 21, 'Habagat',          2.20),
  (15, 23, 'Sinag',           0.80), (16, 24, 'Bagwis',           1.40),
  (17, 25, 'Alon',            1.00), (18, 26, 'Maniwaya Star',    2.80),
  (19, 27, 'Perlas',          1.20), (20, 29, 'Tagumpay',         0.90)
) as b(n, owner_n, name, gt);

-- -----------------------------------------------------------------------------
-- 4. Zones (SAMPLE outlines, illustrative only). Coordinates are lng lat.
-- -----------------------------------------------------------------------------
insert into public.zones (id, name, type, reason, geom, active) values
  (md5('huliko-sample-zone-1')::uuid,
   'Santa Cruz north spawning area', 'restricted',
   'SAMPLE: seasonal no-fishing area to protect fish spawning off Polo and Maniwaya.',
   'SRID=4326;POLYGON((122.045 13.555, 122.075 13.555, 122.075 13.575, 122.045 13.575, 122.045 13.555))', true),
  (md5('huliko-sample-zone-2')::uuid,
   'Gaspar Island Marine Sanctuary (Tres Reyes)', 'sanctuary',
   'SAMPLE outline: no-take coral reef sanctuary around Gaspar Island, Gasan.',
   'SRID=4326;POLYGON((121.843 13.238, 121.875 13.238, 121.875 13.260, 121.843 13.260, 121.843 13.238))', true),
  (md5('huliko-sample-zone-3')::uuid,
   'Boac–Mogpog municipal fishing grounds', 'safe',
   'SAMPLE: open municipal waters for registered small-scale fishers.',
   'SRID=4326;POLYGON((121.765 13.480, 121.835 13.480, 121.835 13.550, 121.765 13.550, 121.765 13.480))', true),
  (md5('huliko-sample-zone-4')::uuid,
   'Boac River mouth advisory area', 'pollution',
   'SAMPLE: shellfish and nearshore catch advisory near the Boac River mouth, affected by the 1996 Marcopper mine tailings spill.',
   'SRID=4326;POLYGON((121.795 13.440, 121.826 13.440, 121.826 13.468, 121.795 13.468, 121.795 13.440))', true);

-- -----------------------------------------------------------------------------
-- 5. Catches (150 generated + 9 scenario logs, last 60 days)
--    Generated with a fixed random seed so every run looks the same.
--    Inserted oldest first through the normal trigger, so zone status, flags,
--    status and QR token are computed exactly as they will be for real logs.
--    Shaped trends for the biodiversity map (SAMPLE): Lapu-lapu weights drop
--    ~45% in the last 30 days, Maya-maya ~25%.
-- -----------------------------------------------------------------------------
select setseed(0.2026);

create temp table _grounds (municipality text primary key, lat numeric, lng numeric, dlat numeric, dlng numeric);
insert into _grounds values
  ('Boac',       13.465, 121.795, 0.022, 0.022),
  ('Mogpog',     13.525, 121.815, 0.020, 0.022),
  ('Gasan',      13.275, 121.830, 0.025, 0.030),
  ('Buenavista', 13.205, 121.950, 0.018, 0.035),
  ('Torrijos',   13.310, 122.150, 0.035, 0.018),
  ('Santa Cruz', 13.548, 122.045, 0.020, 0.030);

create temp table _species_mix (pick int primary key, local_name text, w_min numeric, w_max numeric);
insert into _species_mix
select row_number() over (), local_name, w_min, w_max
from (values
  ('Tulingan', 4, 8, 40), ('Galunggong', 4, 5, 35), ('Dalagang-bukid', 3, 3, 20),
  ('Pusit', 3, 2, 15), ('Lapu-lapu', 2, 2, 12), ('Maya-maya', 2, 2, 14),
  ('Talakitok', 2, 3, 18), ('Danggit', 2, 2, 10), ('Tanguige', 1, 5, 25), ('Bangus', 1, 3, 15)
) as m(local_name, weight, w_min, w_max),
lateral generate_series(1, m.weight);   -- 24 picks, weighted

create temp table _gen as
with r as (
  select g as n,
         random() r_fisher, random() r_species, random() r_w, random() r_size,
         random() r_lat, random() r_lng, random() r_day, random() r_hour,
         random() r_src, random() r_delay, random() r_late, random() r_reason, random() r_pic
  from generate_series(1, 150) g
),
fishers as (
  select p.id, p.municipality, row_number() over (order by p.fishr_no) as k
  from public.profiles p
  where p.role = 'fisher' and p.id in (select md5('huliko-sample-user-' || g)::uuid from generate_series(1, 30) g)
)
select
  r.n,
  f.id as fisher_id,
  f.municipality,
  sp.id as species_id,
  sp.local_name,
  sp.min_legal_size_cm,
  m.w_min + r.r_w * (m.w_max - m.w_min) as base_weight,
  r.r_size,
  gr.lat + (r.r_lat - 0.5) * 2 * gr.dlat as lat,
  gr.lng + (r.r_lng - 0.5) * 2 * gr.dlng as lng,
  ((current_date - (1 + floor(r.r_day * 59))::int)::timestamp
     + interval '3 hours' + r.r_hour * interval '7 hours') at time zone 'Asia/Manila' as caught_at,
  r.r_src, r.r_delay, r.r_late, r.r_reason, r.r_pic
from r
join fishers f       on f.k = 1 + floor(r.r_fisher * 30)::int
join _species_mix m  on m.pick = 1 + floor(r.r_species * 24)::int
join public.species sp on sp.local_name = m.local_name
join _grounds gr     on gr.municipality = f.municipality;

-- Two deliberately oversized hauls on small boats (for the AI-assisted anomaly flag).
update _gen set base_weight = 180 where n = 37;
update _gen set base_weight = 260 where n = 112;

insert into public.catches (
  client_uuid, fisher_id, logged_by, boat_id, species_id, weight_kg, size_cm, geom,
  caught_at, logged_at, source, late_entry_reason
)
select
  case when src = 'app' then gen_random_uuid() end,
  g.fisher_id,
  case when src = 'pic'
       then md5('huliko-sample-user-' || (case when g.r_pic < 0.5 then 31 else 32 end))::uuid
       else g.fisher_id end,
  (select b.id from public.boats b where b.owner_id = g.fisher_id order by b.boatr_no limit 1),
  g.species_id,
  round((g.base_weight * case
           when g.n in (37, 112)                                                         then 1
           when g.local_name = 'Lapu-lapu' and g.caught_at > now() - interval '30 days'  then 0.55
           when g.local_name = 'Maya-maya' and g.caught_at > now() - interval '30 days'  then 0.75
           else 1 end)::numeric, 1),
  case when src = 'sms' then null
       else round((g.min_legal_size_cm * (0.92 + g.r_size * 0.6))::numeric, 1) end,
  case when src = 'sms' then null
       else st_setsrid(st_makepoint(g.lng, g.lat), 4326)::geography end,
  g.caught_at,
  least(now(), g.caught_at + case
           when g.r_late < 0.08 then interval '50 hours' + g.r_delay * interval '70 hours'
           else interval '30 minutes' + g.r_delay * interval '5 hours' end),
  src::public.catch_source,
  case when g.r_late < 0.08 and g.r_reason < 0.5
       then (array['Walang signal sa laot (no signal at sea)',
                   'Lowbat ang cellphone, nag-log pagdating sa pantalan',
                   'Masama ang panahon, sa bahay na nag-log'])[1 + floor(g.r_reason * 6)::int]
  end
from (
  select _gen.*,
         case when r_src < 0.62 then 'app' when r_src < 0.80 then 'sms' else 'pic' end as src
  from _gen
) g
order by g.caught_at;

-- Scenario catches so the hotspot map has something to show (SAMPLE):
-- logs inside the Santa Cruz spawning area and Gaspar sanctuary, and one fisher
-- (Manuel Rey Oriendo, #29) logging three times just outside the spawning area edge.
insert into public.catches (fisher_id, boat_id, species_id, weight_kg, size_cm, geom, caught_at, logged_at, source)
select
  md5('huliko-sample-user-' || s.fisher_n)::uuid,
  (select b.id from public.boats b where b.owner_id = md5('huliko-sample-user-' || s.fisher_n)::uuid limit 1),
  (select sp.id from public.species sp where sp.local_name = s.species),
  s.kg, s.cm,
  st_setsrid(st_makepoint(s.lng, s.lat), 4326)::geography,
  now() - (s.days_ago || ' days')::interval - interval '3 hours',
  now() - (s.days_ago || ' days')::interval - interval '1 hour',
  'app'
from (values
  (29, 'Talakitok',  6.5, 31.0, 13.5620, 122.0520, 16),
  (29, 'Tulingan',  12.0, 26.0, 13.5534, 122.0520, 12),
  (27, 'Lapu-lapu',  4.2, 34.0, 13.5620, 122.0580,  9),
  (29, 'Tulingan',   9.5, 24.5, 13.5530, 122.0620,  8),
  (12, 'Danggit',    3.0, 14.0, 13.2565, 121.8520,  6),
  (30, 'Tulingan',  15.0, 27.0, 13.5660, 122.0660,  5),
  (29, 'Galunggong', 8.0, 15.0, 13.5537, 122.0700,  3),
  (15, 'Maya-maya',  5.5, 29.0, 13.2420, 121.8720,  2),
  (26, 'Talakitok',  7.0, 30.0, 13.5590, 122.0500,  1)
) as s(fisher_n, species, kg, cm, lat, lng, days_ago)
order by s.days_ago desc;

-- Some older flagged logs have already been looked at by the MAO (SAMPLE notes).
update public.catches c
   set status = 'reviewed',
       admin_note = 'SAMPLE: Checked with the fisher at the landing site. Logged for monitoring.'
 where c.status = 'flagged'
   and c.caught_at < now() - interval '14 days'
   and c.fisher_id in (select md5('huliko-sample-user-' || g)::uuid from generate_series(1, 30, 3) g);

-- -----------------------------------------------------------------------------
-- 6. Reports (8)
-- -----------------------------------------------------------------------------
insert into public.reports (id, reporter_id, type, description, geom, status, admin_note, created_at) values
  (md5('huliko-sample-report-1')::uuid, md5('huliko-sample-user-12')::uuid, 'destructive_fishing',
   'SAMPLE: Narinig ang malakas na pagsabog bandang alas-5 ng umaga malapit sa Gaspar Island. (Loud blast heard near Gaspar Island around 5 AM.)',
   'SRID=4326;POINT(121.858 13.259)', 'investigating', 'SAMPLE: Bantay Dagat Gasan notified; patrol scheduled.', now() - interval '3 days'),
  (md5('huliko-sample-report-2')::uuid, md5('huliko-sample-user-21')::uuid, 'commercial_intrusion',
   'SAMPLE: Large commercial boat seen fishing inside municipal waters off Poctoy at night.',
   'SRID=4326;POINT(122.135 13.335)', 'received', null, now() - interval '1 day'),
  (md5('huliko-sample-report-3')::uuid, md5('huliko-sample-user-6')::uuid, 'pollution',
   'SAMPLE: Oil sheen on the water near Balanacan port after a vessel left.',
   'SRID=4326;POINT(121.862 13.528)', 'received', null, now() - interval '2 days'),
  (md5('huliko-sample-report-4')::uuid, null, 'illegal_fishing',
   'SAMPLE: Fine-mesh nets being used close to the Boac River mouth. Reported through the MAO hotline.',
   'SRID=4326;POINT(121.812 13.452)', 'investigating', 'SAMPLE: MAO Boac to inspect gear at Laylay landing site.', now() - interval '6 days'),
  (md5('huliko-sample-report-5')::uuid, md5('huliko-sample-user-27')::uuid, 'destructive_fishing',
   'SAMPLE: Suspected cyanide use on the reef off Maniwaya. Dead reef fish floating.',
   'SRID=4326;POINT(122.068 13.548)', 'received', null, now() - interval '12 hours'),
  (md5('huliko-sample-report-6')::uuid, md5('huliko-sample-user-14')::uuid, 'illegal_fishing',
   'SAMPLE: Small boats fishing inside the sanctuary buoys at night, Tres Reyes.',
   'SRID=4326;POINT(121.847 13.250)', 'resolved', 'SAMPLE: Joint patrol with Bantay Dagat. Fishers reminded of sanctuary rules.', now() - interval '20 days'),
  (md5('huliko-sample-report-7')::uuid, md5('huliko-sample-user-23')::uuid, 'habitat_damage',
   'SAMPLE: Plastic waste and broken coral washing up along Poctoy White Beach.',
   'SRID=4326;POINT(122.097 13.318)', 'resolved', 'SAMPLE: Barangay coastal clean-up held.', now() - interval '27 days'),
  (md5('huliko-sample-report-8')::uuid, md5('huliko-sample-user-28')::uuid, 'illegal_fishing',
   'SAMPLE: Unregistered boat seen repeatedly at the edge of the Santa Cruz spawning area.',
   'SRID=4326;POINT(122.058 13.553)', 'received', null, now() - interval '4 days');

-- Nobody has touched the sample reports yet: last update = filing time.
-- (The touch trigger would reset updated_at to now(), so pause it for this one update.)
alter table public.reports disable trigger reports_touch;
update public.reports set updated_at = created_at
 where id in (select md5('huliko-sample-report-' || g)::uuid from generate_series(1, 8) g);
alter table public.reports enable trigger reports_touch;

-- -----------------------------------------------------------------------------
-- 7. Gallery (6). No photos are seeded; upload real photos during the demo.
-- -----------------------------------------------------------------------------
insert into public.spots_gallery (user_id, title, photo_url, geom, reef_condition, approved, created_at) values
  (md5('huliko-sample-user-11')::uuid, 'SAMPLE: Coral garden, east side of Gaspar Island', null, 'SRID=4326;POINT(121.871 13.249)', 'good', true,  now() - interval '18 days'),
  (md5('huliko-sample-user-26')::uuid, 'SAMPLE: Shallow reef off Maniwaya',                null, 'SRID=4326;POINT(122.090 13.540)', 'fair', true,  now() - interval '9 days'),
  (md5('huliko-sample-user-21')::uuid, 'SAMPLE: Seagrass bed near Poctoy',                 null, 'SRID=4326;POINT(122.100 13.322)', 'good', false, now() - interval '2 days'),
  (md5('huliko-sample-user-3')::uuid,  'SAMPLE: Silted reef near Boac River mouth',        null, 'SRID=4326;POINT(121.818 13.455)', 'poor', false, now() - interval '5 days'),
  (md5('huliko-sample-user-17')::uuid, 'SAMPLE: Reef slope off Bagacay',                   null, 'SRID=4326;POINT(121.960 13.225)', 'fair', true,  now() - interval '30 days'),
  (md5('huliko-sample-user-29')::uuid, 'SAMPLE: Bleached patch near Mongpong Island',      null, 'SRID=4326;POINT(122.110 13.560)', 'poor', false, now() - interval '1 day');

drop table if exists _sample_people, _grounds, _species_mix, _gen;
