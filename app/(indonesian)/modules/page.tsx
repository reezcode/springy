import type { Metadata } from 'next';
import { Info } from 'lucide-react';
import { categories, getOutline } from '@/content';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { ModuleGrid } from '@/components/progress/module-grid';

export const metadata: Metadata = { title: 'Learning path' };

export default function ModulesPage() {
  return (
    <PageContainer wide>
      <PageHeader
        eyebrow="Learning path"
        title="Mau belajar apa hari ini?"
        description="Kalau baru mulai, ikuti dari Java & OOP. Kalau sudah punya dasar, langsung pilih topik yang kamu butuhkan."
      />
      <div className="mt-6 flex gap-3 rounded-xl border border-info/25 bg-info-soft px-4 py-3 text-sm leading-relaxed">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        <p>
          Siapkan Java 21 dan buat project lewat Spring Initializr. Gunakan versi Spring Boot yang sesuai dengan contoh, lalu cek dokumentasi untuk versi tersebut. Waktu tiap modul sudah termasuk perkiraan waktu praktik.
        </p>
      </div>
      <div className="mt-8">
        <ModuleGrid outline={getOutline()} categories={categories} />
      </div>
    </PageContainer>
  );
}
