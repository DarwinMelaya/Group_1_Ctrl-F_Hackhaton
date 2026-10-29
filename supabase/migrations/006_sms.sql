-- =============================================================================
-- Huli Ko — 006_sms.sql
-- SMS catch logging. The webhook calls ingest_sms_catch() with a shared secret,
-- so it needs no service/secret key: this function can only log SMS catches.
--
-- After running this migration, set the secret once (SQL Editor), using the same
-- value as SMS_WEBHOOK_SECRET in .env.local:
--   insert into private.settings (key, value)
--   values ('sms_webhook_secret_hash', extensions.crypt('<your secret>', extensions.gen_salt('bf')))
--   on conflict (key) do update set value = excluded.value;
-- =============================================================================

set search_path = public, extensions;

-- Settings that must never be readable through the API (the API only exposes "public").
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.settings (
  key   text primary key,
  value text not null
);
revoke all on private.settings from public, anon, authenticated;

-- Normalises Philippine mobile numbers to +63XXXXXXXXXX (09…, 639…, +639…, with spaces or dashes).
create or replace function public.normalize_ph_phone(p_phone text)
returns text
language sql immutable
as $$
  select case
    when d ~ '^09\d{9}$'  then '+63' || substr(d, 2)
    when d ~ '^639\d{9}$' then '+' || d
    when d ~ '^9\d{9}$'   then '+63' || d
    else nullif(p_phone, '')
  end
  from (select regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') as d) s
$$;

-- Logs one catch sent by SMS. Location is unknown, so a catch with no other flags is 'pending'.
-- result: 'ok' | 'bad_secret' | 'unknown_phone' | 'unknown_species' | 'invalid_weight' | 'invalid_size'
create or replace function public.ingest_sms_catch(
  p_secret    text,
  p_phone     text,
  p_species   text,
  p_weight_kg numeric,
  p_size_cm   numeric default null
)
returns table (
  result            text,
  fisher_first_name text,
  species_local_name text,
  weight_kg         numeric,
  size_cm           numeric,
  status            public.catch_status,
  flag_reasons      text[],
  qr_token          text
)
language plpgsql volatile security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  v_hash    text;
  v_fisher  public.profiles%rowtype;
  v_species public.species%rowtype;
  v_key     text := regexp_replace(lower(coalesce(p_species, '')), '[^a-z]', '', 'g');
  v_catch   public.catches%rowtype;
begin
  select s.value into v_hash from private.settings s where s.key = 'sms_webhook_secret_hash';
  if v_hash is null or p_secret is null or extensions.crypt(p_secret, v_hash) <> v_hash then
    return query select 'bad_secret', null::text, null::text, null::numeric, null::numeric, null::public.catch_status, null::text[], null::text;
    return;
  end if;

  select * into v_fisher from public.profiles p
   where p.phone = public.normalize_ph_phone(p_phone) and p.role = 'fisher'
   limit 1;
  if v_fisher.id is null then
    return query select 'unknown_phone', null::text, null::text, null::numeric, null::numeric, null::public.catch_status, null::text[], null::text;
    return;
  end if;

  -- "lapu lapu", "LAPU-LAPU" and "grouper" all match; letters only, case-insensitive.
  select * into v_species from public.species sp
   where v_key <> ''
     and (regexp_replace(lower(sp.local_name), '[^a-z]', '', 'g') = v_key
       or regexp_replace(lower(sp.english_name), '[^a-z]', '', 'g') = v_key)
   limit 1;
  if v_species.id is null then
    return query select 'unknown_species', split_part(v_fisher.full_name, ' ', 1), null::text, null::numeric, null::numeric, null::public.catch_status, null::text[], null::text;
    return;
  end if;

  if p_weight_kg is null or p_weight_kg <= 0 or p_weight_kg > 5000 then
    return query select 'invalid_weight', split_part(v_fisher.full_name, ' ', 1), v_species.local_name, null::numeric, null::numeric, null::public.catch_status, null::text[], null::text;
    return;
  end if;
  if p_size_cm is not null and (p_size_cm <= 0 or p_size_cm > 500) then
    return query select 'invalid_size', split_part(v_fisher.full_name, ' ', 1), v_species.local_name, null::numeric, null::numeric, null::public.catch_status, null::text[], null::text;
    return;
  end if;

  insert into public.catches (fisher_id, logged_by, boat_id, species_id, weight_kg, size_cm, source)
  values (
    v_fisher.id, v_fisher.id,
    (select b.id from public.boats b where b.owner_id = v_fisher.id order by b.gross_tons desc nulls last limit 1),
    v_species.id, round(p_weight_kg, 2), round(p_size_cm, 1), 'sms'
  )
  returning * into v_catch;

  return query select 'ok', split_part(v_fisher.full_name, ' ', 1), v_species.local_name,
    v_catch.weight_kg, v_catch.size_cm, v_catch.status, v_catch.flag_reasons, v_catch.qr_token;
end;
$$;

revoke execute on function public.ingest_sms_catch(text, text, text, numeric, numeric) from public;
grant  execute on function public.ingest_sms_catch(text, text, text, numeric, numeric) to anon, authenticated;
