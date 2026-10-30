import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import type { GeoFix } from '@/storage/records';

export type FixState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'ready'; fix: GeoFix }
  // `denied` = the phone refused; `failed` = allowed, but no GPS fix (indoors, timeout).
  | { status: 'denied' }
  | { status: 'failed' };

const TIMEOUT_MS = 20000;

async function currentFix(): Promise<GeoFix> {
  const pos = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)),
  ]);
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracyM: pos.coords.accuracy === null ? null : Math.round(pos.coords.accuracy),
  };
}

// Takes a fix on its own only when location is already allowed, so opening a form never pops a
// permission prompt. `locate()` is the explicit "use my location" tap, which may ask.
export function useLocationFix() {
  const [state, setState] = useState<FixState>({ status: 'idle' });

  const run = useCallback(async (ask: boolean) => {
    try {
      const perm = ask ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setState(ask ? { status: 'denied' } : { status: 'idle' });
        return;
      }
      setState({ status: 'locating' });
      setState({ status: 'ready', fix: await currentFix() });
    } catch {
      setState({ status: 'failed' });
    }
  }, []);

  useEffect(() => {
    run(false);
  }, [run]);

  const locate = useCallback(() => run(true), [run]);
  const clear = useCallback(() => setState({ status: 'idle' }), []);

  return { state, locate, clear, fix: state.status === 'ready' ? state.fix : null };
}
