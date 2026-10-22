'use client';

import Link from 'next/link';
import { ArrowRight, NotebookPen } from 'lucide-react';
import type { Outline } from '@/content';
import { lessonHref } from '@/lib/routes';
import { useProgress } from '@/hooks/use-progress';
import { LinkButton } from '@/components/ui/button';

export function NotesList({ outline }: { outline: Outline }) {
  const { progress, hydrated } = useProgress();
  if (!hydrated) return <div className="h-40 animate-pulse rounded-2xl bg-subtle" />;

  const notes = outline.flatMap((m) => m.lessons.filter((l) => progress.notes[l.id]?.trim()).map((l) => ({ m, l, text: progress.notes[l.id] })));

  if (!notes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong px-6 py-16 text-center">
        <NotebookPen className="mx-auto size-8 text-fg-subtle" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-semibold">Belum ada catatan</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">Di tiap materi ada bagian “Praktik mandiri”. Tulis catatan atau simpan hasil percobaanmu di sana.</p>
        <LinkButton href="/modules/" className="mt-5">Buka learning path</LinkButton>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {notes.map(({ m, l, text }) => (
        <li key={l.id} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm text-fg-subtle">Modul {m.number} · {m.title}</p>
              <h2 className="font-semibold">{l.title}</h2>
            </div>
            <Link href={`${lessonHref(m, l)}#praktik`} className="flex items-center gap-1 text-sm font-medium text-accent-text hover:underline">
              Buka materi <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-3 leading-relaxed whitespace-pre-wrap text-fg-muted">{text}</p>
        </li>
      ))}
    </ul>
  );
}
