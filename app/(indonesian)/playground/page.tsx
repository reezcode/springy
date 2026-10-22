import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout/page-header';
import { labs } from '@/features/labs/registry';

export const metadata: Metadata = { title: 'Playground' };

export default function PlaygroundPage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Playground" title="Coba langsung di playground." description="Kirim request, ganti implementasi, atau buat dependency gagal. Pilih lab dan lihat apa yang berubah. Semua lab ini berupa simulasi di browser." />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {labs.map(({ slug, title, summary, icon: Icon }) => (
          <li key={slug}>
            <Link href={`/playground/${slug}/`} className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-text"><Icon className="size-5" aria-hidden="true" /></span>
              <h2 className="mt-4 text-lg font-semibold tracking-tight group-hover:text-accent-text">{title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg-muted">{summary}</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-medium text-accent-text">Buka lab <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 flex gap-3 rounded-xl border border-border bg-subtle px-4 py-3 text-sm leading-relaxed text-fg-muted">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Lab ini tidak menjalankan Java atau container, dan tidak mengirim request ke server. Untuk mencoba kode dan perintahnya, jalankan di komputermu sendiri. Data lab hilang saat halaman ditutup.
      </p>
    </PageContainer>
  );
}
