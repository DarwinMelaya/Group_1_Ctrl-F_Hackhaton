-- =============================================================================
-- Huli Ko — verification queries. Paste into the Supabase SQL Editor after the
-- four migrations. Each block says what you should see. Changes are rolled back.
-- =============================================================================

-- 1. Row counts. Expect: fishers 30, pic 2, boats 20, zones 4, species 10,
--    catches 159, reports 8, gallery 6.
select
  (select count(*) from profiles where role = 'fisher') as fishers,
  (select count(*) from profiles where role = 'pic')    as pic,
  (select count(*) from boats)         as boats,
  (select count(*) from zones)         as zones,
  (select count(*) from species)       as species,
  (select count(*) from catches)       as catches,
  (select count(*) from reports)       as reports,
  (select count(*) from spots_gallery) as gallery;

-- 2. Catch status mix. Expect all four statuses; roughly 81 verified, 44 flagged,
--    19 pending (SMS logs without location), 15 reviewed.
select status, count(*) from catches group by status order by status;

-- 3. Flag reasons. Expect every code to appear at least once, including
--    restricted_zone, sanctuary, anomaly_near_boundary and anomaly_large_catch.
select reason, count(*) from catches, unnest(flag_reasons) as reason group by reason order by 2 desc;

-- 4. Trigger test: a catch inside the Santa Cruz spawning area.
--    Expect: status 'flagged', zone_status 'restricted', flag_reasons {restricted_zone}
--    and a 12-character qr_token.
begin;
insert into catches (fisher_id, species_id, weight_kg, size_cm, geom, source)
values (
  (select id from profiles where fishr_no like 'FR-MDQ-SAN-%' and license_expiry > current_date limit 1),
  (select id from species where local_name = 'Tulingan'),
  10, 25, 'SRID=4326;POINT(122.060 13.565)', 'app')
returning status, zone_status, flag_reasons, qr_token;
rollback;

-- 5. Late entry with a reason is NOT flagged; without a reason it is.
--    Expect two rows: (Walang signal, verified, {}) and (null, flagged, {late_entry}).
begin;
insert into catches (fisher_id, species_id, weight_kg, size_cm, geom, caught_at, late_entry_reason)
select p.id, s.id, 5, 30, 'SRID=4326;POINT(121.790 13.510)', now() - interval '3 days', r
from (select id from profiles where fishr_no like 'FR-MDQ-MOG-%' and license_expiry > current_date limit 1) p,
     (select id from species where local_name = 'Tulingan') s,
     (values ('Walang signal'), (null)) as v(r)
returning late_entry_reason, status, flag_reasons;
rollback;

-- 6. Public trace: get_trace returns one sanitized row (no coordinates, first name only).
select * from get_trace((select qr_token from catches order by caught_at desc limit 1));

-- 7. RLS is on for every table. Expect rowsecurity = true for all 8 rows.
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;

-- 8. Storage buckets. Expect catch-photos (private), report-photos (private), gallery-photos (public).
select id, public from storage.buckets where id like '%-photos' order by id;

-- 9. After creating your admin user (README step 4): expect your email with role 'admin'.
select u.email, p.role from auth.users u join profiles p on p.id = u.id where p.role = 'admin';
