'use client';

import { BookOpen, CornerDownLeft, FileText, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { SearchEntry } from '@/content';
import { cn } from '@/lib/cn';

const OPEN_EVENT = 'springpath:open-search';

export function SearchTrigger({ compact, className }: { compact?: boolean; className?: string }) {
  const open = () => window.dispatchEvent(new Event(OPEN_EVENT));
  if (compact) {
    return (
      <button type="button" onClick={open} aria-label="Cari materi" className="-mr-2 rounded-lg p-2 text-fg-muted hover:bg-subtle hover:text-fg">
        <Search className="size-5" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={open}
      className={cn('flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-fg-subtle shadow-card transition-colors hover:border-border-strong hover:text-fg-muted', className)}
    >
      <Search className="size-4" aria-hidden="true" />
      <span className="flex-1 text-left">Cari materi…</span>
      <kbd className="rounded border border-border bg-subtle px-1.5 font-mono text-[0.7rem]">/</kbd>
    </button>
  );
}

const normalize = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

function search(index: SearchEntry[], query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return index.filter((e) => e.kind === 'module');
  return index
    .map((entry) => {
      const title = normalize(entry.title);
      const haystack = `${title} ${normalize(entry.context)} ${normalize(entry.text)}`;
      if (!terms.every((t) => haystack.includes(t))) return null;
      const score = terms.reduce((n, t) => n + (title.includes(t) ? 3 : 1), 0) + (entry.kind === 'module' ? 0.5 : 0);
      return { entry, score };
    })
    .filter((r): r is { entry: SearchEntry; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((r) => r.entry);
}

export function SearchDialog({ index }: { index: SearchEntry[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => search(index, query), [index, query]);

  useEffect(() => {
    const open = () => {
      if (!dialog.current?.open) dialog.current?.showModal();
      input.current?.select();
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener(OPEN_EVENT, open);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, open);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  function go(entry: SearchEntry | undefined) {
    if (!entry) return;
    dialog.current?.close();
    setQuery('');
    router.push(entry.href);
  }

  return (
    <dialog
      ref={dialog}
      aria-label="Cari materi"
      onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-border bg-surface p-0 text-fg shadow-pop backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-4.5 shrink-0 text-fg-subtle" aria-hidden="true" />
        <input
          ref={input}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              go(results[active]);
            }
          }}
          placeholder="Cari modul atau materi, mis. transaksi, circuit breaker"
          className="h-14 min-w-0 flex-1 bg-transparent text-[0.95rem] placeholder:text-fg-subtle focus:outline-none"
        />
        <kbd className="hidden rounded border border-border bg-subtle px-1.5 font-mono text-[0.7rem] text-fg-subtle sm:inline">Esc</kbd>
      </div>
      <ul id={listId} role="listbox" aria-label="Hasil pencarian" className="max-h-[50vh] overflow-y-auto p-2">
        {results.map((entry, i) => {
          const Icon = entry.kind === 'module' ? BookOpen : FileText;
          return (
            <li
              key={entry.href}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => go(entry)}
              className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5', i === active && 'bg-accent-soft')}
            >
              <Icon className={cn('size-4 shrink-0', i === active ? 'text-accent-text' : 'text-fg-subtle')} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{entry.title}</span>
                <span className="block truncate text-xs text-fg-muted">{entry.context}</span>
              </span>
              {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />}
            </li>
          );
        })}
        {!results.length && <li className="px-3 py-8 text-center text-sm text-fg-muted">Tidak ada materi yang cocok dengan “{query}”.</li>}
      </ul>
    </dialog>
  );
}
