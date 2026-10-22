'use client';

import { useSyncExternalStore } from 'react';
import { getServerSnapshot, getSnapshot, hasPersistError, progressActions, subscribe } from '@/lib/progress/store';

const noopSubscribe = () => () => {};

/** False during prerender and hydration, true afterwards. Use it to avoid flashing empty progress. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useHydrated();
  return { progress, hydrated, persistError: hydrated && hasPersistError(), actions: progressActions };
}
