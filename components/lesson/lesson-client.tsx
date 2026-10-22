'use client';

import { CheckCircle2, CircleDot, Hammer, NotebookPen } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useProgress } from '@/hooks/use-progress';
import { lessonStatus, type LessonRef } from '@/lib/progress/selectors';
import { progressActions } from '@/lib/progress/store';
import { InlineMarkdown } from '@/components/content/markdown';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

/** Remembers the last opened lesson so the dashboard can offer "continue". */
export function VisitTracker({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    progressActions.visit(lessonId);
  }, [lessonId]);
  return null;
}

export function LessonStatusBadge({ lesson }: { lesson: LessonRef }) {
  const { progress, hydrated } = useProgress();
  if (!hydrated) return null;
  const s = lessonStatus(progress, lesson);
  if (s.complete) return <Badge tone="success"><CheckCircle2 /> Lulus latihan</Badge>;
  if (s.started) return <Badge tone="accent"><CircleDot /> {s.passed}/{s.total} latihan benar</Badge>;
  return null;
}

export function PracticeCard({ lessonId, task, proof }: { lessonId: string; task: string; proof: string }) {
  const { progress, hydrated, persistError, actions } = useProgress();
  const noteId = useId();
  const practiced = hydrated && progress.practiced.includes(lessonId);
  const saved = hydrated ? (progress.notes[lessonId] ?? '') : '';
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? saved;

  // Debounced save so typing does not write to localStorage on every keystroke.
  useEffect(() => {
    if (draft === null) return;
    const t = setTimeout(() => actions.setNote(lessonId, draft), 400);
    return () => clearTimeout(t);
  }, [draft, lessonId, actions]);

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-px bg-border sm:grid-cols-2">
        <div className="bg-surface p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg-subtle"><Hammer className="size-4" aria-hidden="true" /> Tugas</p>
          <p className="mt-2 leading-relaxed"><InlineMarkdown text={task} /></p>
        </div>
        <div className="bg-surface p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-fg-subtle"><CheckCircle2 className="size-4" aria-hidden="true" /> Selesai kalau</p>
          <p className="mt-2 leading-relaxed"><InlineMarkdown text={proof} /></p>
        </div>
      </div>
      <div className="space-y-4 border-t border-border p-5">
        <label htmlFor={noteId} className="flex items-center gap-2 text-sm font-semibold">
          <NotebookPen className="size-4 text-fg-subtle" aria-hidden="true" /> Catatan & bukti praktik
        </label>
        <textarea
          id={noteId}
          value={value}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== null && actions.setNote(lessonId, draft)}
          rows={4}
          placeholder="Tulis pemahamanmu, tempel tautan repo, atau hasil perintah yang kamu jalankan…"
          className="w-full resize-y rounded-xl border border-border-strong bg-surface px-3.5 py-3 text-[0.95rem] leading-relaxed placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
        {persistError && <p role="alert" className="text-sm text-danger">Penyimpanan browser tidak tersedia. Ekspor progres dari Pengaturan sebelum menutup halaman.</p>}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-subtle px-4 py-3">
          <input type="checkbox" checked={practiced} onChange={() => actions.togglePracticed(lessonId)} className="mt-0.5 size-4 accent-[var(--color-accent)]" />
          <span className="text-sm leading-relaxed">
            <span className="font-medium">Saya sudah mempraktikkan tugas ini di komputer sendiri.</span>
            <span className="block text-fg-muted">Penanda mandiri, tidak dinilai otomatis. Kelulusan materi ditentukan oleh latihan di atas.</span>
          </span>
        </label>
      </div>
    </Card>
  );
}
