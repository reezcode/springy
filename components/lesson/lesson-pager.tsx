import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getNeighbours, lessonHref } from '@/content';

export function LessonPager({ lessonId, moduleId }: { lessonId: string; moduleId: string }) {
  const { prev, next } = getNeighbours(lessonId);
  const card = 'group flex min-w-0 flex-1 flex-col gap-1 rounded-xl border border-border bg-surface px-4 py-3 shadow-card transition-colors hover:border-accent/40';
  return (
    <nav aria-label="Materi sebelumnya dan berikutnya" className="flex flex-col gap-3 sm:flex-row">
      {prev ? (
        <Link href={lessonHref(prev.module, prev.lesson)} className={card}>
          <span className="flex items-center gap-1 text-sm text-fg-muted"><ArrowLeft className="size-3.5" aria-hidden="true" /> Sebelumnya</span>
          <span className="truncate font-medium group-hover:text-accent-text">{prev.lesson.title}</span>
        </Link>
      ) : <span className="hidden flex-1 sm:block" />}
      {next ? (
        <Link href={lessonHref(next.module, next.lesson)} className={`${card} sm:items-end sm:text-right`}>
          <span className="flex items-center gap-1 text-sm text-fg-muted">Berikutnya <ArrowRight className="size-3.5" aria-hidden="true" /></span>
          <span className="max-w-full truncate font-medium group-hover:text-accent-text">{next.lesson.title}</span>
          {next.module.id !== moduleId && <span className="text-xs text-fg-subtle">Modul {next.module.number} · {next.module.title}</span>}
        </Link>
      ) : (
        <Link href="/" className={`${card} sm:items-end sm:text-right`}>
          <span className="text-sm text-fg-muted">Jalur selesai</span>
          <span className="font-medium">Kembali ke beranda</span>
        </Link>
      )}
    </nav>
  );
}
