'use client';

import { Pause, Sparkles } from 'lucide-react';
import { useMotion } from '@/hooks/use-motion';

export function MotionToggle() {
  const { enabled, toggle } = useMotion();
  return (
    <button type="button" aria-label="Animasi" aria-pressed={enabled} onClick={toggle} className="flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-1 text-xs text-fg-muted hover:text-fg">
      <span className="flex items-center gap-1.5"><Sparkles className="size-3.5" aria-hidden="true" /> Animasi</span>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-subtle px-2 py-1">
        {enabled ? <Sparkles className="size-3" aria-hidden="true" /> : <Pause className="size-3" aria-hidden="true" />}
        {enabled ? 'Aktif' : 'Tenang'}
      </span>
    </button>
  );
}
