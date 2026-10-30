import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_PREFIX } from '@/constants/app';
import { isMunicipalityId, type MunicipalityId } from '@/constants/municipalities';
import { isRoleId, type RoleId } from '@/constants/roles';

const KEY = `${STORAGE_PREFIX}/onboarding/v1`;

export interface OnboardingState {
  completed: boolean;
  role: RoleId | null;
  municipality: MunicipalityId | null;
  barangay: string;
}

export const EMPTY_ONBOARDING: OnboardingState = {
  completed: false,
  role: null,
  municipality: null,
  barangay: '',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Anything unexpected falls back to defaults rather than crashing on launch.
function parse(raw: string | null): OnboardingState {
  if (!raw) return EMPTY_ONBOARDING;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return EMPTY_ONBOARDING;
    return {
      completed: data.completed === true,
      role: isRoleId(data.role) ? data.role : null,
      municipality: isMunicipalityId(data.municipality) ? data.municipality : null,
      barangay: typeof data.barangay === 'string' ? data.barangay : '',
    };
  } catch {
    return EMPTY_ONBOARDING;
  }
}

export async function loadOnboarding(): Promise<OnboardingState> {
  try {
    return parse(await AsyncStorage.getItem(KEY));
  } catch {
    return EMPTY_ONBOARDING;
  }
}

export async function saveOnboarding(state: OnboardingState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export async function clearOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
