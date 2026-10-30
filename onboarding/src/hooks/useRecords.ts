import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  loadCatches,
  loadReports,
  NEW_SYNC,
  newUuid,
  saveCatches,
  saveReports,
  type CatchRecord,
  type ReportRecord,
} from '@/storage/records';

type NewCatch = Omit<CatchRecord, 'clientUuid' | 'recordedAt' | 'sync'>;
type NewReport = Omit<ReportRecord, 'clientUuid' | 'createdAt' | 'sync'>;

interface RecordsContextValue {
  isLoaded: boolean;
  // Newest first.
  catches: CatchRecord[];
  reports: ReportRecord[];
  addCatch: (c: NewCatch) => Promise<CatchRecord>;
  deleteCatch: (clientUuid: string) => Promise<void>;
  addReport: (r: NewReport) => Promise<ReportRecord>;
  // For the sync engine.
  updateCatchSync: (clientUuid: string, sync: CatchRecord['sync']) => Promise<void>;
  updateReportSync: (clientUuid: string, sync: ReportRecord['sync']) => Promise<void>;
  // Bumps on every new record, so the sync engine can send right away.
  revision: number;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

const byNewest = <T,>(key: (x: T) => string) => (a: T, b: T) => key(b).localeCompare(key(a));

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [catches, setCatches] = useState<CatchRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [revision, setRevision] = useState(0);
  // Latest lists for writes, so two quick saves never overwrite each other.
  const latest = useRef({ catches, reports });

  useEffect(() => {
    let active = true;
    Promise.all([loadCatches(), loadReports()]).then(([c, r]) => {
      if (!active) return;
      latest.current = { catches: c.sort(byNewest((x) => x.caughtAt)), reports: r.sort(byNewest((x) => x.createdAt)) };
      setCatches(latest.current.catches);
      setReports(latest.current.reports);
      setIsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Each write must succeed before the screen says "saved"; on failure the list is left untouched.
  const writeCatches = useCallback(async (next: CatchRecord[]) => {
    await saveCatches(next);
    latest.current.catches = next;
    setCatches(next);
  }, []);

  const writeReports = useCallback(async (next: ReportRecord[]) => {
    await saveReports(next);
    latest.current.reports = next;
    setReports(next);
  }, []);

  const addCatch = useCallback(
    async (c: NewCatch) => {
      const record: CatchRecord = { ...c, clientUuid: newUuid(), recordedAt: new Date().toISOString(), sync: { ...NEW_SYNC } };
      await writeCatches([record, ...latest.current.catches].sort(byNewest((x) => x.caughtAt)));
      setRevision((n) => n + 1);
      return record;
    },
    [writeCatches],
  );

  // Only unsent catches can be removed; once sent, the MAO holds the record.
  const deleteCatch = useCallback(
    (clientUuid: string) =>
      writeCatches(latest.current.catches.filter((c) => c.clientUuid !== clientUuid || c.sync.state === 'sent')),
    [writeCatches],
  );

  const addReport = useCallback(
    async (r: NewReport) => {
      const record: ReportRecord = { ...r, clientUuid: newUuid(), createdAt: new Date().toISOString(), sync: { ...NEW_SYNC } };
      await writeReports([record, ...latest.current.reports]);
      setRevision((n) => n + 1);
      return record;
    },
    [writeReports],
  );

  const updateCatchSync = useCallback(
    (clientUuid: string, sync: CatchRecord['sync']) =>
      writeCatches(latest.current.catches.map((c) => (c.clientUuid === clientUuid ? { ...c, sync } : c))),
    [writeCatches],
  );

  const updateReportSync = useCallback(
    (clientUuid: string, sync: ReportRecord['sync']) =>
      writeReports(latest.current.reports.map((r) => (r.clientUuid === clientUuid ? { ...r, sync } : r))),
    [writeReports],
  );

  const value = useMemo(
    () => ({ isLoaded, catches, reports, addCatch, deleteCatch, addReport, updateCatchSync, updateReportSync, revision }),
    [isLoaded, catches, reports, addCatch, deleteCatch, addReport, updateCatchSync, updateReportSync, revision],
  );
  return createElement(RecordsContext.Provider, { value }, children);
}

export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used inside <RecordsProvider>');
  return ctx;
}
