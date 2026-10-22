import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock, ListChecks, Target } from 'lucide-react';
import { getModule, getOutline, lessonHref, modules } from '@/content';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-header';
import { SourceLink } from '@/components/content/source-link';
import { LessonList } from '@/components/progress/dashboard';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ModuleIcon } from '@/components/ui/module-icon';

export const dynamicParams = false;

export function generateStaticParams() {
  return modules.map((m) => ({ moduleSlug: m.slug }));
}

export async function generateMetadata({ params }: PageProps<'/modules/[moduleSlug]'>): Promise<Metadata> {
  const mod = getModule((await params).moduleSlug);
  return mod ? { title: mod.title, description: mod.subtitle } : {};
}

export default async function ModulePage({ params }: PageProps<'/modules/[moduleSlug]'>) {
  const mod = getModule((await params).moduleSlug);
  if (!mod) notFound();
  const outlineModule = getOutline().find((m) => m.id === mod.id)!;
  const exerciseCount = mod.lessons.reduce((n, l) => n + l.exercises.length, 0);
  const refIds = [...new Set(mod.lessons.flatMap((l) => l.refs.map((r) => r.source)))];
  const next = modules[mod.number];

  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: '/modules/', label: 'Learning path' }, { label: `Modul ${mod.number}` }]} />

      <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <ModuleIcon icon={mod.icon} tint={mod.tint} size="lg" />
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-fg-subtle">Modul {mod.number} · {mod.category}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance sm:text-[2.1rem]">{mod.title}</h1>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-fg-muted">{mod.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge><Clock /> {mod.hours} jam termasuk praktik</Badge>
            <Badge><ListChecks /> {mod.lessons.length} materi · {exerciseCount} latihan</Badge>
          </div>
          <LinkButton href={lessonHref(mod, mod.lessons[0])} className="mt-6 h-11 px-5">
            Mulai modul <ArrowRight className="size-4" />
          </LinkButton>
        </div>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="lessons-title">
          <h2 id="lessons-title" className="mb-4 text-xl font-semibold tracking-tight">Daftar materi</h2>
          <LessonList mod={outlineModule} />
        </section>

        <aside className="space-y-6">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold"><Target className="size-4.5 text-accent-text" aria-hidden="true" /> Target modul</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-fg-muted">
              {mod.lessons.map((l) => (
                <li key={l.id} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {l.objectives[0]}
                </li>
              ))}
            </ul>
          </Card>
          <section aria-labelledby="refs-title">
            <h2 id="refs-title" className="mb-3 font-semibold">Referensi modul</h2>
            <div className="space-y-2">
              {refIds.map((id) => <SourceLink key={id} id={id} />)}
            </div>
          </section>
          {next && (
            <p className="text-sm text-fg-muted">
              Setelah ini: <Link href={`/modules/${next.slug}/`} className="font-medium text-accent-text hover:underline">Modul {next.number} · {next.title}</Link>
            </p>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
