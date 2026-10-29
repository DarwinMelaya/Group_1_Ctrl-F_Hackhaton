# Huli Ko

Fisheries traceability and coastal resource management for small-scale fishers in Marinduque, Philippines.
Each catch gets a QR code that shows who caught it, where, when, and whether it came from a legal, safe zone.
LGU, MAO, BFAR and Bantay Dagat staff use the admin dashboard to protect fish stocks, track registration
and respond to illegal fishing.

> **SAMPLE DATA.** The seed (`supabase/migrations/004_seed.sql`) uses real Marinduque place names and real
> species, but the people, phone numbers, FishR/BoatR numbers, boats, zone outlines, legal sizes, closed
> seasons, catches and reports are all fictional. Zone outlines are illustrative, not official ordinances.

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind + shadcn/ui · Supabase (Postgres + PostGIS, Auth, Storage, RLS)
· TanStack Table · Recharts · Leaflet · zod · sonner

## Setup (about 10 minutes)

### 1. Create a Supabase project
[supabase.com/dashboard](https://supabase.com/dashboard) > New project. Region: Southeast Asia (Singapore).
Save the database password.

### 2. Run the migrations, in order

| Order | File | What it does |
|---|---|---|
| 1 | `001_schema.sql` | PostGIS, enums, tables, indexes |
| 2 | `002_functions_triggers.sql` | Catch checking trigger, QR tokens, role helpers, GeoJSON views |
| 3 | `003_rls.sql` | Row Level Security, public QR trace, storage buckets |
| 4 | `004_seed.sql` | SAMPLE DATA (safe to re-run) |
| 5 | `005_analytics.sql` | `overview_stats()` for the dashboard Overview |
| 6 | `006_sms.sql` | `ingest_sms_catch()` for SMS logging, private settings schema |
| 7 | `007_anomalies.sql` | `anomaly_review()`: evidence behind each AI-assisted check |
| 8 | `008_offline_recorded_at.sql` | `catches.recorded_at` so offline-saved logs are not treated as late |

**Option A: SQL Editor (simplest).** Dashboard > SQL Editor > New query. Paste the whole of each file, click
**Run**, wait for "Success", then do the next file.

**Option B: Supabase CLI** (installed as a dev dependency):

```powershell
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`<project-ref>` is the `xxxx` in `https://xxxx.supabase.co`.

> `004_seed.sql` is a migration so the demo is one command. Before using a real production database,
> delete `004_seed.sql` (or run it once in the SQL Editor instead).

### 3. Verify
Paste `supabase/verify.sql` into the SQL Editor and run it. Each block lists what you should see. In short:

- 30 fishers, 2 PIC, 20 boats, 4 zones, 10 species, 159 catches, 8 reports, 6 gallery items
- All four catch statuses present (roughly 81 verified, 44 flagged, 19 pending, 15 reviewed; exact numbers
  shift a little depending on the date, because closed seasons and license expiry depend on today's date)
- The test catch inside the Santa Cruz spawning area comes back `flagged` / `restricted` with a QR token
- A late entry with a reason is `verified`; without one it is `flagged` with `{late_entry}`
- RLS is `true` on all 8 tables; 3 storage buckets exist

### 4. Create the admin user
1. Dashboard > Authentication > Users > **Add user** > Create new user. Enter your email and a password
   and tick **Auto Confirm User**.
2. In the SQL Editor:

```sql
update public.profiles
   set role = 'admin', full_name = 'MAO Admin', municipality = 'Boac'
 where id = (select id from auth.users where email = 'you@example.com');
```

Every new sign-up starts as `fisher`. Only this SQL (or another admin) can grant `admin` or `pic`.

### 5. Environment
```powershell
Copy-Item .env.example .env.local
```
Fill in the URL and publishable key from Dashboard > Project Settings > API Keys. The app never needs the
`sb_secret_...` key.

**QR codes on phones:** set `NEXT_PUBLIC_SITE_URL` to an address phones can reach. For a demo on the same
Wi-Fi, use this computer's IP (`ipconfig`), e.g. `http://192.168.1.20:3001`, and start the app with
`npx next dev -p 3001 -H 0.0.0.0`. Windows may ask to allow Node.js through the firewall: allow it on private
networks.

**SMS webhook:** put a long random value in `SMS_WEBHOOK_SECRET` (for example from
`node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`), then store its hash once in the
SQL Editor:

```sql
insert into private.settings (key, value)
values ('sms_webhook_secret_hash', extensions.crypt('<same secret>', extensions.gen_salt('bf')))
on conflict (key) do update set value = excluded.value;
```

The webhook uses only the publishable key; `ingest_sms_catch()` checks the secret and can do nothing except log
an SMS catch, so no Supabase secret key is needed anywhere.

### 6. Generate types (whenever the schema changes)
```powershell
npx supabase gen types typescript --project-id <project-ref> --schema public > lib/database.types.ts
```
The committed `lib/database.types.ts` was generated from these exact migrations, so this is only needed
after you change the SQL.

### 7. Run
```powershell
npm install
npm run dev
```
Open http://localhost:3000/admin and sign in as the admin.

## Mobile app (/app) for fishers and PICs

An installable, offline-first PWA in the same project. Tagalog first, English toggle.

- **Run with the service worker:** `npm run build && npx next start -p 3001 -H 0.0.0.0`
  (the worker is disabled in `next dev`, so offline mode only works on a production build).
- **Test logins (SAMPLE DATA):** `FISHER_EMAIL` / `FISHER_PASSWORD` (Ricardo Monterey, Santa Cruz) and
  `PIC_EMAIL` / `PIC_PASSWORD` (Grace Livelo, Boac) in `.env.local`. Re-running `004_seed.sql` removes them.
  Admins who log in at `/app/login` are sent to `/admin`; fishers and PICs who log in at `/login` are sent to `/app`.
- **On a real phone you need HTTPS:** GPS and the service worker do not work over `http://192.168…`.
  Quick tunnel, no account: `npx cloudflared tunnel --url http://localhost:3001`, then open the `https://…trycloudflare.com/app`
  address on the phone. For a stable link, deploy a Vercel preview.
- **Offline test on a laptop:** open `/app` once online (installs the worker), then Chrome DevTools > Network > Offline
  and reload. The app opens from the phone's cache; the status chip shows "Offline".
- **Late entries and offline logs (migration 008):** the phone sends `recorded_at` (when it saved the log). A catch saved
  on time but synced days later is not a late entry. Device time is trusted for at most 7 days.

## How catch checking works

A database trigger (`evaluate_catch` in `002_functions_triggers.sql`) runs on every insert, whether the catch
comes from the app, SMS or a PIC. It cannot be bypassed from the client.

| Rule | Flag code | Result |
|---|---|---|
| Inside an active restricted zone | `restricted_zone` | flagged for review |
| Inside an active marine sanctuary | `sanctuary` | flagged for review |
| License expired before the catch date | `license_expired` | flagged for review |
| No license on record | `license_missing` | flagged for review |
| Species in its yearly closed season | `closed_season` | flagged for review |
| Below minimum legal size | `undersized` | flagged for review |
| Logged > 48 h late **with no reason** | `late_entry` | flagged for review |
| AI-assisted (rule-based): > 100 kg per gross ton of the boat | `anomaly_large_catch` | flagged for review |
| AI-assisted (rule-based): 3rd+ log within 300 m of a protected boundary in 14 days | `anomaly_near_boundary` | flagged for review |
| Inside a pollution zone | none | `zone_status = pollution` (advisory on the QR page, not a flag) |

The **AI-assisted checks** page (`/admin/anomalies`) shows the numbers behind every pattern and compliance flag,
for example "260 kg on a 2.2 GT boat = 118.2 kg per ton (limit 100)". These are plain published rules, not
machine learning, and they only put a log up for review. Thresholds live in `evaluate_catch()` (002),
`anomaly_review()` (007) and `lib/anomalies/rules.ts`; change all three together.

No flags and a location gives `verified`. No flags but no location (an SMS log) gives `pending`. Editing a
catch's species, size, weight, place or time re-runs the checks. Fishers cannot change status, review notes,
log time or their own license data. The trigger and RLS enforce this.

## Biodiversity trend rule

Defined once in `lib/analytics/biodiversity.ts` and shown in the map legend.

1. Waters are split into grid cells of 0.05 degrees (about 5.5 km).
2. Per cell (and per species when one is selected), logged catch per day in the last N days (30 or 14)
   is compared with the N days before.
3. **Abundant:** change of -15% or better. **Declining:** -15% to -40%. **Critical:** worse than -40%.
4. **Not enough data:** fewer than 3 logs across both periods, or nothing logged in the earlier period.

The same rule is applied island-wide per species ("Species trend, all waters"), which also counts SMS logs
without a location. Limitation: it measures logged catch, not catch per trip, so fewer fishers using the app
also looks like a decline. It is an early signal to check on the ground, not a stock assessment.

## Privacy
- Exact coordinates are only returned to admins (and to the fisher who logged them).
- The public QR page calls `get_trace(token)`, which returns one row: species, date, fisher first name,
  municipality, status and pollution advisory. It never returns coordinates, and catches cannot be listed.

## Project layout
```
supabase/migrations/   numbered SQL, run in order
supabase/verify.sql    checks to run after migrating
lib/supabase/          browser, server and middleware clients (@supabase/ssr)
lib/database.types.ts  generated types
lib/types.ts           domain type aliases
lib/catch/flags.ts     flag codes and plain-language labels (mirrors the SQL)
lib/zones/geo.ts       zone colors, map defaults, point helpers
middleware.ts          session refresh and the /admin role guard
```

## 3-minute demo script
Each step uses a dashboard feature; the steps go live as features are built.

1. **Flag a catch (0:00–0:45).** Open SMS Simulator, or run test 4 from `verify.sql` without the
   `rollback`. Log a Tulingan catch at 13.565, 122.060, inside the Santa Cruz north spawning area.
2. **Watch it get flagged (0:45–1:15).** Catches > filter Flagged. The new row reads "Logged inside a
   restricted area", for review. Mark it Reviewed with a note.
3. **See it on the hotspot map (1:15–1:45).** Hotspots: the Santa Cruz spawning area tops the ranked list,
   next to the community report of an unregistered boat at its edge.
4. **Open the report queue (1:45–2:30).** Reports: open the Gaspar Island blast report, move it to
   Investigating, add a note.
5. **Scan the QR (2:30–3:00).** Open `/trace/<qr_token>` on a phone. It shows species, date, first name,
   municipality and the Flagged for review badge, with no coordinates.
