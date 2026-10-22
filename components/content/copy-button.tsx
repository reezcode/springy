'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const t = setTimeout(() => setState('idle'), 2000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState('copied');
        } catch {
          setState('failed');
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    >
      {state === 'copied' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span aria-live="polite">{state === 'copied' ? 'Tersalin' : state === 'failed' ? 'Gagal menyalin' : 'Salin'}</span>
    </button>
  );
}
