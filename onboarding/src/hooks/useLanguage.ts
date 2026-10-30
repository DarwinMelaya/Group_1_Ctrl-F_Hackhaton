import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { STORAGE_PREFIX } from '@/constants/app';

// The app language, chosen once and kept on this phone. Text is written in pairs at the place it is
// shown: `t('Good morning', 'Magandang umaga')`, so each screen reads plainly in both languages.
export type Lang = 'en' | 'fil';

const KEY = `${STORAGE_PREFIX}/language/v1`;
let current: Lang = 'en';
let chosen = false;
let loaded = false;
const listeners = new Set<() => void>();

export async function setLanguage(lang: Lang) {
  current = lang;
  chosen = true;
  listeners.forEach((l) => l());
  try {
    await AsyncStorage.setItem(KEY, lang);
  } catch {
    // Stays for this session.
  }
}

export function useLanguage() {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    if (!loaded) {
      loaded = true;
      AsyncStorage.getItem(KEY)
        .then((v) => {
          if (v === 'en' || v === 'fil') {
            current = v;
            chosen = true;
            listeners.forEach((x) => x());
          }
        })
        .catch(() => {});
    }
    return () => {
      listeners.delete(l);
    };
  }, []);
  const lang = current;
  const t = useCallback((en: string, fil: string) => (lang === 'fil' ? fil : en), [lang]);
  return { lang, chosen, t, setLanguage };
}
