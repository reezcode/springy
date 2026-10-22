'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/cn';

type Theme = 'system' | 'light' | 'dark';
const KEY = 'springpath-theme';

/** Inline script for <head>: applies the theme before first paint to avoid a flash. */
export const themeScript = `(function(){try{var t=localStorage.getItem('${KEY}');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`;

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

function readStored(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

const noop = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const stored = useSyncExternalStore(noop, readStored, () => null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const current = theme ?? stored;

  // Follow OS changes while the user has not picked a theme explicitly.
  useEffect(() => {
    if (current !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [current]);

  function choose(next: Theme) {
    setTheme(next);
    try {
      if (next === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {}
    apply(next);
  }

  const options = [
    { value: 'light', label: 'Terang', icon: Sun },
    { value: 'dark', label: 'Gelap', icon: Moon },
    { value: 'system', label: 'Ikuti sistem', icon: Monitor },
  ] as const;

  return (
    <div role="radiogroup" aria-label="Tema tampilan" className={cn('inline-flex rounded-lg border border-border bg-subtle p-0.5', className)}>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={current === value}
          aria-label={label}
          title={label}
          onClick={() => choose(value)}
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md text-fg-subtle transition-colors hover:text-fg',
            current === value && 'bg-surface text-fg shadow-card',
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
