'use client';

import { useEffect, useSyncExternalStore } from 'react';

const KEY = 'springy-motion';
const EVENT = 'springy:motion';
const QUERY = '(prefers-reduced-motion: reduce)';
let sessionPreference: string | null = null;

/** Apply saved preferences before first paint; CSS also enforces the OS preference. */
export const motionScript = `(function(){try{document.documentElement.dataset.motion=localStorage.getItem('${KEY}')==='off'||matchMedia('${QUERY}').matches?'off':'on';}catch(e){}})();`;

function getSnapshot() {
  if (matchMedia(QUERY).matches) return false;
  try { return (localStorage.getItem(KEY) ?? sessionPreference) !== 'off'; } catch { return sessionPreference !== 'off'; }
}

function subscribe(listener: () => void) {
  const media = matchMedia(QUERY);
  media.addEventListener('change', listener);
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    media.removeEventListener('change', listener);
    window.removeEventListener(EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

export function useMotion() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, () => true);
  useEffect(() => {
    document.documentElement.dataset.motion = enabled ? 'on' : 'off';
  }, [enabled]);
  function toggle() {
    // Never override a device-level reduced-motion preference.
    if (matchMedia(QUERY).matches) return;
    sessionPreference = enabled ? 'off' : 'on';
    try { localStorage.setItem(KEY, sessionPreference); } catch {}
    window.dispatchEvent(new Event(EVENT));
  }
  return { enabled, toggle };
}
