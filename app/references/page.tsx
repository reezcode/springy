import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { lessonHref, modules, sources } from '@/content';
import { PageContainer, PageHeader } from '@/components/layout/page-header';

export const metadata: Metadata = { title: 'Referensi' };

export default function ReferencesPage() {
  // Which lessons cite each source, so learners can jump both ways.
  const citedBy = new Map<string, { href: string; label: string }[]>();
  for (const m of modules) {
    for (const l of m.lessons) {
      for (const r of l.refs) {
        const list = citedBy.get(r.source) ?? [];
        list.push({ href: lessonHref(m, l), label: `${m.number}.${m.lessons.indexOf(l) + 1} ${l.title}` });
        citedBy.set(r.source, list);
      }
    }
  }
  const publishers = [...new Set(sources.map((s) => s.publisher.split(' · ')[0]))];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Referensi"
        title="Ringkasan untuk mulai, dokumentasi untuk mendalami."
        description="Setiap materi merangkum sumber resmi di bawah. Dokumentasi tanpa nomor versi bisa berubah; cocokkan dengan versi project-mu. Disusun Oktober 2026."
      />
      <div className="mt-8 space-y-10">
        {publishers.map((publisher) => (
          <section key={publisher} aria-labelledby={`pub-${publisher}`}>
            <h2 id={`pub-${publisher}`} className="mb-3 text-sm font-semibold tracking-wide text-fg-subtle uppercase">{publisher}</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {sources
                .filter((s) => s.publisher.split(' · ')[0] === publisher)
                .map((s) => {
                  const cites = citedBy.get(s.id) ?? [];
                  return (
                    <li key={s.id} className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-card">
                      <a href={s.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-3">
                        <span>
                          <span className="block font-semibold group-hover:text-accent-text">{s.title}</span>
                          <span className="block text-sm text-fg-subtle">{new URL(s.url).hostname}</span>
                          <span className="sr-only"> (membuka tab baru)</span>
                        </span>
                        <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-fg-subtle group-hover:text-accent" aria-hidden="true" />
                      </a>
                      {cites.length > 0 && (
                        <div className="mt-3 border-t border-border pt-3">
                          <p className="text-xs text-fg-subtle">Dipakai di</p>
                          <ul className="mt-1 space-y-0.5 text-sm">
                            {cites.slice(0, 4).map((c) => (
                              <li key={c.href}><Link href={c.href} className="text-fg-muted hover:text-accent-text hover:underline">{c.label}</Link></li>
                            ))}
                            {cites.length > 4 && <li className="text-xs text-fg-subtle">+{cites.length - 4} materi lain</li>}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
