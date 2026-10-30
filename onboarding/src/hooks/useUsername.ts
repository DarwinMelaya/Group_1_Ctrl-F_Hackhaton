import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { STORAGE_PREFIX } from '@/constants/app';

// The nickname from onboarding, kept on this phone and used for the Home greeting.
const KEY = `${STORAGE_PREFIX}/username/v1`;
let current: string | null = null;
let loaded = false;
const listeners = new Set<(name: string | null) => void>();

export async function saveUsername(name: string) {
  current = name.trim() || null;
  listeners.forEach((l) => l(current));
  try {
    if (current) await AsyncStorage.setItem(KEY, current);
    else await AsyncStorage.removeItem(KEY);
  } catch {
    // The greeting just falls back to the profile name.
  }
}

export function useUsername() {
  const [name, setName] = useState(current);
  useEffect(() => {
    listeners.add(setName);
    if (!loaded) {
      loaded = true;
      AsyncStorage.getItem(KEY)
        .then((v) => {
          current = v;
          listeners.forEach((l) => l(v));
        })
        .catch(() => {});
    }
    return () => {
      listeners.delete(setName);
    };
  }, []);
  return name;
}
