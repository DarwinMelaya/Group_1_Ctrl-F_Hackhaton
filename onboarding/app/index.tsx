import { Redirect } from 'expo-router';

import { useOnboarding } from '@/hooks/useOnboarding';

// The root layout only renders once saved state has loaded, so this is safe.
export default function Index() {
  const { state } = useOnboarding();
  return <Redirect href={state.completed ? '/home' : '/welcome'} />;
}
