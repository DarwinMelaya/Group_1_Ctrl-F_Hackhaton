import { useCallback, useEffect, useRef, useState } from 'react';

import type { Municipality } from '@/constants/municipalities';
import { fetchSeaConditions, loadCachedConditions, type SeaConditions } from '@/services/seaConditions';

export type SeaConditionsState =
  | { status: 'loading' }
  // `stale` = showing the saved reading because the latest fetch failed (usually no signal).
  | { status: 'ready'; data: SeaConditions; stale: boolean }
  | { status: 'error' };

// Shows the saved reading at once, then replaces it with a fresh one when the network allows.
export function useSeaConditions(town: Municipality | undefined) {
  const [state, setState] = useState<SeaConditionsState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const latest = useRef<SeaConditions | null>(null);

  const refresh = useCallback(async () => {
    if (!town) return;
    setRefreshing(true);
    try {
      const data = await fetchSeaConditions(town);
      latest.current = data;
      setState({ status: 'ready', data, stale: false });
    } catch {
      setState(latest.current ? { status: 'ready', data: latest.current, stale: true } : { status: 'error' });
    } finally {
      setRefreshing(false);
    }
  }, [town]);

  useEffect(() => {
    if (!town) return;
    let active = true;
    setState({ status: 'loading' });
    loadCachedConditions(town).then((cached) => {
      if (!active) return;
      latest.current = cached;
      if (cached) setState({ status: 'ready', data: cached, stale: true });
      refresh();
    });
    return () => {
      active = false;
    };
  }, [town, refresh]);

  return { state, refreshing, refresh };
}
