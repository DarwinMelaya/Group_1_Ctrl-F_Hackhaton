import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { refreshCatchStatuses, sendCatch, sendReport, Transient } from '@/services/sync';

import { useAuth } from './useAuth';
import { useRecords } from './useRecords';

interface SyncContextValue {
  syncing: boolean;
  // Records still on the phone, and ones the server refused.
  waiting: number;
  failed: number;
  // true when the last attempt could not reach the server.
  offline: boolean;
  syncNow: () => Promise<void>;
}

const RETRY_MS = 60_000;

const SyncContext = createContext<SyncContextValue | null>(null);

// Sends after login, after every save, when the app comes back to the front, on pull-to-refresh,
// and once a minute while anything is waiting.
export function SyncProvider({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  const { isLoaded, catches, reports, updateCatchSync, updateReportSync, revision } = useRecords();
  const [syncing, setSyncing] = useState(false);
  const [offline, setOffline] = useState(false);
  const running = useRef(false);
  const latest = useRef({ catches, reports });
  latest.current = { catches, reports };

  const userId = auth.status === 'signedIn' ? auth.userId : null;

  const syncNow = useCallback(async () => {
    if (!userId || running.current) return;
    running.current = true;
    setSyncing(true);
    try {
      for (const c of latest.current.catches.filter((x) => x.sync.state === 'waiting')) {
        try {
          const server = await sendCatch(c, userId);
          await updateCatchSync(c.clientUuid, { state: 'sent', attempts: c.sync.attempts + 1, lastError: null, server });
        } catch (e) {
          if (e instanceof Transient || !(e instanceof Error)) throw e;
          await updateCatchSync(c.clientUuid, { state: 'failed', attempts: c.sync.attempts + 1, lastError: e.message, server: null });
        }
      }
      for (const r of latest.current.reports.filter((x) => x.sync.state === 'waiting')) {
        try {
          const server = await sendReport(r, userId);
          await updateReportSync(r.clientUuid, { state: 'sent', attempts: r.sync.attempts + 1, lastError: null, server });
        } catch (e) {
          if (e instanceof Transient || !(e instanceof Error)) throw e;
          await updateReportSync(r.clientUuid, { state: 'failed', attempts: r.sync.attempts + 1, lastError: e.message, server: null });
        }
      }

      const open = latest.current.catches.filter((c) => c.sync.server && c.sync.server.status !== 'reviewed');
      const fresh = await refreshCatchStatuses(open.map((c) => c.sync.server!.id));
      for (const c of open) {
        const next = fresh.get(c.sync.server!.id);
        if (next && (next.status !== c.sync.server!.status || next.flagReasons.join() !== c.sync.server!.flagReasons.join())) {
          await updateCatchSync(c.clientUuid, { ...c.sync, server: next });
        }
      }
      setOffline(false);
    } catch {
      // No signal or the server is unreachable: everything waiting stays waiting.
      setOffline(true);
    } finally {
      running.current = false;
      setSyncing(false);
    }
  }, [userId, updateCatchSync, updateReportSync]);

  const waiting = catches.filter((c) => c.sync.state === 'waiting').length + reports.filter((r) => r.sync.state === 'waiting').length;
  const failed = catches.filter((c) => c.sync.state === 'failed').length + reports.filter((r) => r.sync.state === 'failed').length;

  // After login, once records are loaded, and after every new save.
  useEffect(() => {
    if (isLoaded && userId) syncNow();
  }, [isLoaded, userId, revision, syncNow]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') syncNow();
    });
    return () => sub.remove();
  }, [syncNow]);

  useEffect(() => {
    if (!userId || waiting === 0) return;
    const id = setInterval(syncNow, RETRY_MS);
    return () => clearInterval(id);
  }, [userId, waiting, syncNow]);

  const value = useMemo(() => ({ syncing, waiting, failed, offline, syncNow }), [syncing, waiting, failed, offline, syncNow]);
  return createElement(SyncContext.Provider, { value }, children);
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside <SyncProvider>');
  return ctx;
}
