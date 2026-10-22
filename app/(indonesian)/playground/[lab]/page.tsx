import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { getModule } from '@/content';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { ApiLab } from '@/features/labs/api-lab';
import { BreakerLab } from '@/features/labs/breaker-lab';
import { ContainerLab } from '@/features/labs/container-lab';
import { SolidLab } from '@/features/labs/solid-lab';
import { labs } from '@/features/labs/registry';

const components = { api: ApiLab, solid: SolidLab, breaker: BreakerLab, container: ContainerLab };

export const dynamicParams = false;

export function generateStaticParams() {
  return labs.map((l) => ({ lab: l.slug }));
}

export async function generateMetadata({ params }: PageProps<'/playground/[lab]'>): Promise<Metadata> {
  const { lab: slug } = await params;
  const lab = labs.find((l) => l.slug === slug);
  return lab ? { title: `${lab.title} · Playground`, description: lab.summary } : {};
}

export default async function LabPage({ params }: PageProps<'/playground/[lab]'>) {
  const { lab: slug } = await params;
  const lab = labs.find((l) => l.slug === slug);
  if (!lab) notFound();
  const Lab = components[lab.slug];
  const mod = getModule(lab.module);

  return (
    <PageContainer wide>
      <Breadcrumbs items={[{ href: '/playground/', label: 'Playground' }, { label: lab.title }]} />
      <PageHeader
        title={lab.title}
        description={lab.summary}
        actions={
          mod && (
            <Link href={`/modules/${mod.slug}/`} className="flex items-center gap-1.5 text-sm font-medium text-accent-text hover:underline">
              <BookOpen className="size-4" aria-hidden="true" /> Materi terkait: {mod.title}
            </Link>
          )
        }
      />
      <div className="mt-8">
        <Lab />
      </div>
    </PageContainer>
  );
}
