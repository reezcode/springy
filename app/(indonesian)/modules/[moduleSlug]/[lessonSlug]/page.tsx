import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Clock, ListChecks, Sparkles } from 'lucide-react';
import { getLesson, getLessonBody, modules } from '@/content';
import { extractHeadings } from '@/lib/markdown';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Markdown, InlineMarkdown } from '@/components/content/markdown';
import { SourceLink } from '@/components/content/source-link';
import { ExerciseSet } from '@/components/exercises/exercise-set';
import { LessonPager } from '@/components/lesson/lesson-pager';
import { LessonToc } from '@/components/lesson/lesson-toc';
import { LessonStatusBadge, PracticeCard, VisitTracker } from '@/components/lesson/lesson-client';
import { Badge } from '@/components/ui/badge';

export const dynamicParams = false;

export function generateStaticParams() {
  return modules.flatMap((m) => m.lessons.map((l) => ({ moduleSlug: m.slug, lessonSlug: l.slug })));
}

export async function generateMetadata({ params }: PageProps<'/modules/[moduleSlug]/[lessonSlug]'>): Promise<Metadata> {
  const { moduleSlug, lessonSlug } = await params;
  const found = getLesson(moduleSlug, lessonSlug);
  return found ? { title: `${found.lesson.title} · ${found.module.title}`, description: found.lesson.summary } : {};
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="mb-2 scroll-mt-24 text-[1.5rem] font-semibold tracking-tight">{children}</h2>;
}

export default async function LessonPage({ params }: PageProps<'/modules/[moduleSlug]/[lessonSlug]'>) {
  const { moduleSlug, lessonSlug } = await params;
  const found = getLesson(moduleSlug, lessonSlug);
  if (!found) notFound();
  const { module: mod, lesson } = found;
  const index = mod.lessons.indexOf(lesson);
  const lessonRef = { id: lesson.id, exerciseIds: lesson.exercises.map((e) => e.id) };
  const body = getLessonBody(mod, lesson);

  const toc = [
    ...extractHeadings(body).map((h) => ({ id: h.id, text: h.text })),
    { id: 'ringkasan', text: 'Ringkasan' },
    { id: 'latihan', text: 'Latihan' },
    { id: 'praktik', text: 'Praktik mandiri' },
    { id: 'referensi', text: 'Referensi' },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <VisitTracker lessonId={lesson.id} />
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-12">
        <article className="mx-auto min-w-0 max-w-3xl xl:mx-0">
          <Breadcrumbs
            items={[
              { href: '/modules/', label: 'Learning path' },
              { href: `/modules/${mod.slug}/`, label: `${mod.number}. ${mod.title}` },
              { label: `Materi ${index + 1}` },
            ]}
          />

          <header>
            <p className="text-sm font-semibold text-accent-text">Modul {mod.number} · Materi {index + 1} dari {mod.lessons.length}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-[2.25rem] sm:leading-tight">{lesson.title}</h1>
            <p className="mt-3 text-[1.1rem] leading-relaxed text-fg-muted">{lesson.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge><Clock /> ±{lesson.minutes} menit</Badge>
              <Badge><ListChecks /> {lesson.exercises.length} latihan</Badge>
              <LessonStatusBadge lesson={lessonRef} />
            </div>
          </header>

          <section aria-labelledby="objectives-title" className="mt-8 rounded-2xl border border-accent/20 bg-accent-soft/50 p-5">
            <h2 id="objectives-title" className="flex items-center gap-2 font-semibold"><Sparkles className="size-4.5 text-accent-text" aria-hidden="true" /> Setelah materi ini, kamu bisa:</h2>
            <ul className="mt-3 space-y-1.5 leading-relaxed">
              {lesson.objectives.map((o) => (
                <li key={o} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  <span><InlineMarkdown text={o} /></span>
                </li>
              ))}
            </ul>
          </section>

          <Markdown source={body} className="mt-4" />

          <section aria-labelledby="ringkasan" className="mt-12">
            <SectionTitle id="ringkasan">Ringkasan</SectionTitle>
            <ul className="mt-4 space-y-2.5">
              {lesson.keyPoints.map((point) => (
                <li key={point} className="flex gap-3 rounded-xl border border-border bg-surface px-4 py-3 leading-relaxed shadow-card">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-success" />
                  <span><InlineMarkdown text={point} /></span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="latihan" className="mt-12">
            <SectionTitle id="latihan">Latihan</SectionTitle>
            <p className="mb-5 leading-relaxed text-fg-muted">Jawab semua soal dengan benar untuk menuntaskan materi ini. Jawaban diperiksa langsung di browser dan progres tersimpan otomatis.</p>
            <ExerciseSet lessonId={lesson.id} exercises={lesson.exercises} />
          </section>

          <section aria-labelledby="praktik" className="mt-12">
            <SectionTitle id="praktik">Praktik mandiri</SectionTitle>
            <p className="mb-5 leading-relaxed text-fg-muted">Coba tugas ini di project-mu sendiri. Simpan catatan, tautan repo, atau hasil percobaannya supaya mudah kamu cek lagi.</p>
            <PracticeCard lessonId={lesson.id} task={lesson.practice.task} proof={lesson.practice.proof} />
          </section>

          <section aria-labelledby="referensi" className="mt-12">
            <SectionTitle id="referensi">Referensi</SectionTitle>
            <p className="mb-5 leading-relaxed text-fg-muted">Materi di atas merangkum sumber berikut. Buka sumber aslinya untuk detail, versi terbaru, dan contoh tambahan.</p>
            <div className="grid gap-2">
              {lesson.refs.map((r) => <SourceLink key={r.source} id={r.source} note={r.note} />)}
            </div>
          </section>

          <div className="mt-12 border-t border-border pt-8">
            <LessonPager lessonId={lesson.id} moduleId={mod.id} />
          </div>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-10">
            <LessonToc items={toc} />
          </div>
        </aside>
      </div>
    </div>
  );
}
