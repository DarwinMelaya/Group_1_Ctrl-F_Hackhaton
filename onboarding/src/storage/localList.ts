import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { STORAGE_PREFIX } from '@/constants/app';

// A small list kept only on this phone (farm lines, harvests, patrols). These have no table in the
// Huli Ko database yet, so screens say plainly that they are not sent anywhere.

export function useLocalList<T>(name: string, parse: (v: unknown) => T | null) {
  const key = `${STORAGE_PREFIX}/${name}`;
  const [items, setItems] = useState<T[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const latest = useRef<T[]>([]);
  const parseRef = useRef(parse);
  parseRef.current = parse;

  // Reload when the screen comes back into view, so a change made on another tab shows up.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      AsyncStorage.getItem(key)
        .then((raw) => {
          const data: unknown = JSON.parse(raw ?? '[]');
          return Array.isArray(data) ? data.map((v) => parseRef.current(v)).filter((x): x is T => x !== null) : [];
        })
        .catch(() => [] as T[])
        .then((list) => {
          if (!active) return;
          latest.current = list;
          setItems(list);
          setIsLoaded(true);
        });
      return () => {
        active = false;
      };
    }, [key]),
  );

  // The write must succeed before the screen shows the change.
  const write = useCallback(
    async (next: T[]) => {
      await AsyncStorage.setItem(key, JSON.stringify(next));
      latest.current = next;
      setItems(next);
    },
    [key],
  );

  const update = useCallback((fn: (list: T[]) => T[]) => write(fn(latest.current)), [write]);

  return { items, isLoaded, update };
}
