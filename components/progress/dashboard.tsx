'use client';

import Link from 'next/link';
import { ArrowRight, BookCheck, CheckCheck, Flame, Layers } from 'lucide-react';
import type { Outline } from '@/content';
import { lessonHref } from '@/lib/routes';
import { useProgress } from '@/hooks/use-progress';
import { currentStreak } from '@/lib/progress/schema';
import { lessonStatus, moduleStatus, nextLessonId, overallStatus } from '@/lib/progress/selectors';
import { cn } from '@/lib/cn';
import { LinkButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ModuleIcon } from '@/components/ui/module-icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusIcon } from './status-icon';

export function ContinueCard({ outline }: { outline: Outline }) {
  const { progress, hydrated } = useProgress();
  const overall = overallStatus(progress, outline);
  const nextId = hydrated ? nextLessonId(progress, outline) : outline[0].lessons[0].id;
  const mod = outline.find((m) => m.lessons.some((l) => l.id === nextId)) ?? outline[0];
  const lesson = mod.lessons.find((l) => l.id === nextId) ?? mod.lessons[0];
  const fresh = !hydrated || (overall.exercisesPassed === 0 && !progress.lastLesson);
  const done = hydrated && overall.lessonsComplete === overall.lessonsTotal;

  return (
    <Card className="relative overflow-hidden p-6 sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent-soft blur-2xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-accent-text">{done ? 'Semua materi selesai' : fresh ? 'Mulai dari sini' : 'Lanjutkan belajar'}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-balance">{done ? 'Semua latihan selesai. Mau mengulang materi?' : lesson.title}</h2>
          {!done && (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-fg-muted">
              <span>Modul {mod.number} · {mod.title}</span>
              <span aria-hidden="true">·</span>
              <span>±{lesson.minutes} menit</span>
            </p>
          )}
        </div>
        <LinkButton href={done ? '/modules/' : lessonHref(mod, lesson)} className="h-11 self-start px-5 md:self-auto">
          {done ? 'Lihat learning path' : fresh ? 'Mulai materi pertama' : 'Lanjutkan'}
          <ArrowRight className="size-4" />
        </LinkButton>
      </div>
    </Card>
  );
}

export function StatsRow({ outline }: { outline: Outline }) {
  const { progress, hydrated } = useProgress();
  const o = overallStatus(progress, outline);
  const streak = hydrated ? currentStreak(progress.activity) : 0;
  const v = (n: number) => (hydrated ? n : 0);
  const stats = [
    { icon: BookCheck, label: 'Materi selesai', value: v(o.lessonsComplete), total: o.lessonsTotal },
    { icon: CheckCheck, label: 'Soal terjawab benar', value: v(o.exercisesPassed), total: o.exercisesTotal },
    { icon: Layers, label: 'Modul selesai', value: v(o.modulesComplete), total: outline.length },
    { icon: Flame, label: 'Hari belajar beruntun', value: streak, total: undefined },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ icon: Icon, label, value, total }) => (
        <Card key={label} className="p-4">
          <dt className="flex items-center gap-2 text-sm text-fg-muted">
            <Icon className="size-4 text-fg-subtle" aria-hidden="true" />
            {label}
          </dt>
          <dd className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
            {value}
            {total !== undefined && <span className="text-base font-medium text-fg-subtle"> / {total}</span>}
          </dd>
        </Card>
      ))}
    </dl>
  );
}

export function ModuleProgressList({ outline }: { outline: Outline }) {
  const { progress, hydrated } = useProgress();
  return (
    <Card className="divide-y divide-border">
      {outline.map((m) => {
        const s = moduleStatus(progress, m);
        const percent = hydrated ? s.percent : 0;
        return (
          <Link key={m.id} href={`/modules/${m.slug}/`} className="group flex items-center gap-4 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-subtle sm:px-5">
            <ModuleIcon icon={m.icon} tint={m.tint} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                <span className="mr-2 text-fg-subtle tabular-nums">{String(m.number).padStart(2, '0')}</span>
                {m.title}
              </p>
              <p className="truncate text-sm text-fg-muted">{m.category} · {m.hours} jam</p>
            </div>
            <div className="hidden w-36 sm:block">
              <ProgressBar value={percent} label={`Progres ${m.title}`} tone={percent === 100 ? 'success' : 'accent'} />
            </div>
            <span className={cn('w-12 text-right text-sm tabular-nums', percent === 100 ? 'font-semibold text-success' : 'text-fg-muted')}>{percent}%</span>
          </Link>
        );
      })}
    </Card>
  );
}

/** Lesson list with live status, used on module pages. */
export function LessonList({ mod }: { mod: Outline[number] }) {
  const { progress, hydrated } = useProgress();
  return (
    <ol className="space-y-2">
      {mod.lessons.map((l, i) => {
        const s = lessonStatus(progress, l);
        const state = !hydrated ? 'todo' : s.complete ? 'complete' : s.started || s.practiced ? 'started' : 'todo';
        return (
          <li key={l.id}>
            <Link href={lessonHref(mod, l)} className="group flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3.5 shadow-card transition-colors hover:border-accent/40">
              <StatusIcon state={state} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-fg-subtle">Materi {i + 1}</p>
                <p className="font-medium group-hover:text-accent-text">{l.title}</p>
              </div>
              <div className="hidden shrink-0 text-right text-sm text-fg-muted sm:block">
                <p>±{l.minutes} menit</p>
                <p className="tabular-nums">{hydrated ? s.passed : 0}/{s.total} latihan</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
