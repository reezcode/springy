'use client';

import Link from 'next/link';
import { Clock, ListChecks } from 'lucide-react';
import { useState } from 'react';
import type { Category, Outline } from '@/content';
import { useProgress } from '@/hooks/use-progress';
import { moduleStatus } from '@/lib/progress/selectors';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { ModuleIcon } from '@/components/ui/module-icon';
import { ProgressBar } from '@/components/ui/progress-bar';

type Status = 'all' | 'todo' | 'done';

export function ModuleGrid({ outline, categories }: { outline: Outline; categories: Category[] }) {
  const { progress, hydrated } = useProgress();
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');

  const visible = outline.filter((m) => {
    const s = moduleStatus(progress, m);
    return (category === 'all' || m.category === category) && (status === 'all' || (status === 'done' ? s.done : !s.done));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter kategori" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {(['all', ...categories] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                'h-8 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors',
                category === c ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface text-fg-muted hover:text-fg',
              )}
            >
              {c === 'all' ? 'Semua' : c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="h-8 rounded-lg border border-border bg-surface px-2 text-sm text-fg"
          >
            <option value="all">Semua</option>
            <option value="todo">Belum tuntas</option>
            <option value="done">Tuntas</option>
          </select>
        </label>
      </div>

      <p className="sr-only" aria-live="polite">{visible.length} modul ditampilkan</p>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((m) => {
          const s = moduleStatus(progress, m);
          const percent = hydrated ? s.percent : 0;
          return (
            <li key={m.id}>
              <Link href={`/modules/${m.slug}/`} className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop">
                <div className="flex items-start justify-between">
                  <ModuleIcon icon={m.icon} tint={m.tint} />
                  <span className="font-mono text-sm text-fg-subtle">{String(m.number).padStart(2, '0')}</span>
                </div>
                <p className="mt-4 text-xs font-semibold tracking-wide text-fg-subtle uppercase">{m.category}</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight group-hover:text-accent-text">{m.title}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg-muted">{m.subtitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge><Clock /> {m.hours} jam</Badge>
                  <Badge><ListChecks /> {m.lessons.length} materi</Badge>
                  {hydrated && s.done && <Badge tone="success">Tuntas</Badge>}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <ProgressBar value={percent} label={`Progres ${m.title}`} tone={percent === 100 ? 'success' : 'accent'} />
                  <span className="w-10 text-right text-xs text-fg-muted tabular-nums">{percent}%</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {!visible.length && (
        <div className="rounded-2xl border border-dashed border-border-strong px-6 py-14 text-center">
          <p className="font-semibold">Tidak ada modul untuk filter ini.</p>
          <button type="button" onClick={() => { setCategory('all'); setStatus('all'); }} className="mt-2 text-sm font-medium text-accent-text hover:underline">
            Tampilkan semua modul
          </button>
        </div>
      )}
    </div>
  );
}
