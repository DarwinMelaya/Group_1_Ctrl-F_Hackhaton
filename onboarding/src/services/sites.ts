import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { STORAGE_PREFIX } from '@/constants/app';

import { supabase } from './supabase';

// Visitor rules for coastal sites (migration 010) and the visitor's own check-in.
// Limits are set by the MAO in the admin dashboard; null means no official limit has been set.
export interface SiteStatus {
  place_id: string;
  capacity: number | null;
  max_stay_minutes: number | null;
  open_from: string | null;
  open_to: string | null;
  fee_php: number | null;
  notes: string | null;
  source: string | null;
  visitors_now: number;
}

export interface Visit {
  visitId: string;
  placeId: string;
  checkedInAt: string;
  endsAt: string | null;
}

const DEVICE_KEY = `${STORAGE_PREFIX}/device-id/v1`;
const VISIT_KEY = `${STORAGE_PREFIX}/site-visit/v1`;

async function deviceId(): Promise<string> {
  const saved = await AsyncStorage.getItem(DEVICE_KEY).catch(() => null);
  if (saved) return saved;
  const id = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  await AsyncStorage.setItem(DEVICE_KEY, id).catch(() => {});
  return id;
}

export type CheckInError = 'full' | 'closed' | 'offline' | 'unavailable';

// One store for the visit so the map banner and the place card agree.
let visit: Visit | null = null;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function saveVisit(next: Visit | null) {
  visit = next;
  emit();
  try {
    if (next) await AsyncStorage.setItem(VISIT_KEY, JSON.stringify(next));
    else await AsyncStorage.removeItem(VISIT_KEY);
  } catch {
    // Kept in memory for this session.
  }
}

export async function checkIn(placeId: string, partySize: number): Promise<{ ok: true } | { ok: false; error: CheckInError }> {
  if (!supabase) return { ok: false, error: 'unavailable' };
  const { data, error } = await supabase.rpc('site_check_in', { p_place_id: placeId, p_device_id: await deviceId(), p_party_size: partySize });
  if (error) {
    if (/full/.test(error.message)) return { ok: false, error: 'full' };
    if (/closed/.test(error.message)) return { ok: false, error: 'closed' };
    if (/fetch|network/i.test(error.message)) return { ok: false, error: 'offline' };
    return { ok: false, error: 'unavailable' };
  }
  const row = (data as { visit_id: string; ends_at: string | null }[] | null)?.[0];
  if (!row) return { ok: false, error: 'unavailable' };
  await saveVisit({ visitId: row.visit_id, placeId, checkedInAt: new Date().toISOString(), endsAt: row.ends_at });
  return { ok: true };
}

export async function checkOut() {
  const current = visit;
  await saveVisit(null);
  if (current && supabase) {
    await supabase.rpc('site_check_out', { p_visit_id: current.visitId, p_device_id: await deviceId() });
  }
}

export function useVisit() {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    if (!loaded) {
      loaded = true;
      AsyncStorage.getItem(VISIT_KEY)
        .then((v) => {
          if (v && !visit) {
            visit = JSON.parse(v) as Visit;
            emit();
          }
        })
        .catch(() => {});
    }
    return () => {
      listeners.delete(l);
    };
  }, []);
  return visit;
}

// Rules and live counts for every site; refreshed every minute while shown.
export function useSiteStatus(active: boolean) {
  const [sites, setSites] = useState<Record<string, SiteStatus>>({});
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    if (!supabase) return setFailed(true);
    const { data, error } = await supabase.rpc('site_status');
    if (error || !data) return setFailed(true);
    setFailed(false);
    setSites(Object.fromEntries((data as SiteStatus[]).map((s) => [s.place_id, s])));
  }, []);
  useEffect(() => {
    if (!active) return;
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [active, load]);
  return { sites, failed, reload: load };
}

// Minutes left in the visit, ticking every 15 seconds. null when the site has no time limit.
export function useMinutesLeft(v: Visit | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!v?.endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [v?.endsAt]);
  if (!v?.endsAt) return null;
  return Math.ceil((new Date(v.endsAt).getTime() - now) / 60_000);
}
