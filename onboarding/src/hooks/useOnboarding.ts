import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { MunicipalityId } from '@/constants/municipalities';
import type { RoleId } from '@/constants/roles';
import {
  clearOnboarding,
  EMPTY_ONBOARDING,
  loadOnboarding,
  saveOnboarding,
  type OnboardingState,
} from '@/storage/onboardingStorage';

interface OnboardingContextValue {
  state: OnboardingState;
  isLoaded: boolean;
  setRole: (role: RoleId) => void;
  setMunicipality: (municipality: MunicipalityId) => void;
  setBarangay: (barangay: string) => void;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(EMPTY_ONBOARDING);
  const [isLoaded, setIsLoaded] = useState(false);
  // Mirrors state so complete() can save the latest values without a stale closure.
  const latest = useRef(state);

  useEffect(() => {
    let active = true;
    loadOnboarding().then((saved) => {
      if (!active) return;
      latest.current = saved;
      setState(saved);
      setIsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Each answer is saved as soon as it's given, so a dropped app resumes cleanly.
  const update = useCallback((patch: Partial<OnboardingState>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setState(next);
    saveOnboarding(next).catch(() => {
      // Storage failures shouldn't block onboarding; complete() retries the save.
    });
  }, []);

  const setRole = useCallback((role: RoleId) => update({ role }), [update]);
  const setMunicipality = useCallback(
    (municipality: MunicipalityId) => update({ municipality }),
    [update],
  );
  const setBarangay = useCallback((barangay: string) => update({ barangay }), [update]);

  const complete = useCallback(async () => {
    const next: OnboardingState = {
      ...latest.current,
      barangay: latest.current.barangay.trim(),
      completed: true,
    };
    latest.current = next;
    await saveOnboarding(next);
    setState(next);
  }, []);

  const reset = useCallback(async () => {
    await clearOnboarding();
    latest.current = EMPTY_ONBOARDING;
    setState(EMPTY_ONBOARDING);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({ state, isLoaded, setRole, setMunicipality, setBarangay, complete, reset }),
    [state, isLoaded, setRole, setMunicipality, setBarangay, complete, reset],
  );

  return createElement(OnboardingContext.Provider, { value }, children);
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}
