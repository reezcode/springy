import type { Metadata } from 'next';
import { Info } from 'lucide-react';
import { categories, getOutline } from '@/content';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { ModuleGrid } from '@/components/progress/module-grid';

export const metadata: Metadata = { title: 'Jalur belajar' };

export default function ModulesPage() {
  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Jalur belajar"
        title="Satu jalur, fondasi yang utuh."
        description="Ikuti urutannya dari Java sampai OpenShift, atau langsung ke topik yang ingin kamu dalami. Semua modul terbuka."
      />
      <div className="mt-6 flex gap-3 rounded-xl border border-info/25 bg-info-soft px-4 py-3 text-sm leading-relaxed">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        <p>
          Siapkan Java 21 dan project dari Spring Initializr. Pilih satu rilis Spring Boot yang stabil dan cocokkan contoh dengan dokumentasi versinya. Estimasi waktu adalah perkiraan latihan.
        </p>
      </div>
      <div className="mt-8">
        <ModuleGrid outline={getOutline()} categories={categories} />
      </div>
    </PageContainer>
  );
}
