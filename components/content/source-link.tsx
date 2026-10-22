import { ArrowUpRight } from 'lucide-react';
import { getSource } from '@/content/sources';

export function SourceLink({ id, note }: { id: string; note?: string }) {
  const s = getSource(id);
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
    >
      <span className="min-w-0">
        <span className="block text-xs font-medium text-fg-subtle">{s.publisher}</span>
        <span className="block font-medium text-fg">{s.title}</span>
        {note && <span className="mt-0.5 block text-sm text-fg-muted">{note}</span>}
        <span className="sr-only"> (membuka tab baru)</span>
      </span>
      <ArrowUpRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
    </a>
  );
}
