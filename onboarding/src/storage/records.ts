import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_PREFIX } from '@/constants/app';
import { isReportTypeId, type ReportTypeId } from '@/constants/reportTypes';

// Catches and reports kept on the phone until they reach the Huli Ko database. `clientUuid` is
// generated here and sent as catches.client_uuid, so a retry after a lost reply never duplicates.

export interface GeoFix {
  lat: number;
  lng: number;
  accuracyM: number | null;
}

export type CatchStatus = 'verified' | 'flagged' | 'pending' | 'reviewed';

// waiting: not sent yet (no account, no signal, or a retry is due). failed: the server refused it
// for good (a check failed); it needs a person, not another retry.
export interface SyncInfo<Server> {
  state: 'waiting' | 'failed' | 'sent';
  attempts: number;
  lastError: string | null;
  server: Server | null;
}

export interface CatchServer {
  id: string;
  status: CatchStatus;
  flagReasons: string[];
  qrToken: string;
}

export interface CatchRecord {
  clientUuid: string;
  speciesLocalName: string;
  weightKg: number;
  sizeCm: number | null;
  // ISO times: when it was caught, and when the phone saved it (catches.recorded_at).
  caughtAt: string;
  recordedAt: string;
  location: GeoFix | null;
  sync: SyncInfo<CatchServer>;
}

export interface ReportRecord {
  clientUuid: string;
  type: ReportTypeId;
  description: string;
  createdAt: string;
  location: GeoFix | null;
  sync: SyncInfo<{ id: string }>;
}

export const NEW_SYNC = { state: 'waiting', attempts: 0, lastError: null, server: null } as const;

const CATCH_STATUSES: readonly string[] = ['verified', 'flagged', 'pending', 'reviewed'];

const CATCHES_KEY = `${STORAGE_PREFIX}/catches/v1`;
const REPORTS_KEY = `${STORAGE_PREFIX}/reports/v1`;

export function newUuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // RFC 4122 v4 shape; Math.random is enough for de-duplicating one phone's own records.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

function parseFix(v: unknown): GeoFix | null {
  if (typeof v !== 'object' || v === null) return null;
  const g = v as Record<string, unknown>;
  return isNum(g.lat) && isNum(g.lng) ? { lat: g.lat, lng: g.lng, accuracyM: isNum(g.accuracyM) ? g.accuracyM : null } : null;
}

function parseSync<S>(v: unknown, parseServer: (s: Record<string, unknown>) => S | null): SyncInfo<S> {
  if (typeof v !== 'object' || v === null) return { ...NEW_SYNC };
  const s = v as Record<string, unknown>;
  const server = typeof s.server === 'object' && s.server !== null ? parseServer(s.server as Record<string, unknown>) : null;
  const state = s.state === 'sent' && server ? 'sent' : s.state === 'failed' ? 'failed' : 'waiting';
  return { state, attempts: isNum(s.attempts) ? s.attempts : 0, lastError: isStr(s.lastError) ? s.lastError : null, server };
}

const parseCatchServer = (s: Record<string, unknown>): CatchServer | null =>
  isStr(s.id) && isStr(s.qrToken) && isStr(s.status) && CATCH_STATUSES.includes(s.status)
    ? { id: s.id, qrToken: s.qrToken, status: s.status as CatchStatus, flagReasons: Array.isArray(s.flagReasons) ? s.flagReasons.filter(isStr) : [] }
    : null;

// Rows that do not parse are dropped rather than crashing the list.
function parseCatch(v: unknown): CatchRecord | null {
  if (typeof v !== 'object' || v === null) return null;
  const r = v as Record<string, unknown>;
  if (!isStr(r.clientUuid) || !isStr(r.speciesLocalName) || !isNum(r.weightKg) || !isStr(r.caughtAt) || !isStr(r.recordedAt)) return null;
  return {
    clientUuid: r.clientUuid,
    speciesLocalName: r.speciesLocalName,
    weightKg: r.weightKg,
    sizeCm: isNum(r.sizeCm) ? r.sizeCm : null,
    caughtAt: r.caughtAt,
    recordedAt: r.recordedAt,
    location: parseFix(r.location),
    sync: parseSync(r.sync, parseCatchServer),
  };
}

function parseReport(v: unknown): ReportRecord | null {
  if (typeof v !== 'object' || v === null) return null;
  const r = v as Record<string, unknown>;
  if (!isStr(r.clientUuid) || !isReportTypeId(r.type) || !isStr(r.description) || !isStr(r.createdAt)) return null;
  return {
    clientUuid: r.clientUuid,
    type: r.type,
    description: r.description,
    createdAt: r.createdAt,
    location: parseFix(r.location),
    sync: parseSync(r.sync, (s) => (isStr(s.id) ? { id: s.id } : null)),
  };
}

async function loadList<T>(key: string, parse: (v: unknown) => T | null): Promise<T[]> {
  try {
    const data: unknown = JSON.parse((await AsyncStorage.getItem(key)) ?? '[]');
    return Array.isArray(data) ? data.map(parse).filter((x): x is T => x !== null) : [];
  } catch {
    return [];
  }
}

export const loadCatches = () => loadList(CATCHES_KEY, parseCatch);
export const loadReports = () => loadList(REPORTS_KEY, parseReport);
export const saveCatches = (list: CatchRecord[]) => AsyncStorage.setItem(CATCHES_KEY, JSON.stringify(list));
export const saveReports = (list: ReportRecord[]) => AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(list));
