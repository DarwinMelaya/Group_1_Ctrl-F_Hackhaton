import { useCallback, useEffect, useState } from 'react';

import { fetchZones, loadCachedZones, type ZoneCache } from '@/services/zones';

import { useAuth } from './useAuth';

export type ZonesState =
  | { status: 'loading' }
  // `stale`: showing the copy on the phone because the latest fetch failed.
  | { status: 'ready'; data: ZoneCache; stale: boolean }
  // Zones are a signed-in read and nothing is saved on this phone yet.
  | { status: 'needsSignIn' }
  | { status: 'error' };

export function useZones() {
  const { auth } = useAuth();
  const [state, setState] = useState<ZonesState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const signedIn = auth.status === 'signedIn';

  const refresh = useCallback(async () => {
    const cached = await loadCachedZones();
    if (!signedIn) {
      setState(cached ? { status: 'ready', data: cached, stale: true } : { status: 'needsSignIn' });
      return;
    }
    setRefreshing(true);
    try {
      setState({ status: 'ready', data: await fetchZones(), stale: false });
    } catch {
      setState(cached ? { status: 'ready', data: cached, stale: true } : { status: 'error' });
    } finally {
      setRefreshing(false);
    }
  }, [signedIn]);

  useEffect(() => {
    if (auth.status === 'loading') return;
    // Show the phone's copy at once; the fresh one replaces it.
    loadCachedZones().then((cached) => {
      if (cached) setState({ status: 'ready', data: cached, stale: true });
      refresh();
    });
  }, [auth.status, refresh]);

  return { state, refreshing, refresh };
}
