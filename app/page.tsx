import Link from 'next/link';
import { ArrowRight, BookOpenText, FlaskConical, ListChecks, Library } from 'lucide-react';
import { categories, getOutline, lessons, modules, sources } from '@/content';
import { PageContainer } from '@/components/layout/page-header';
import { ContinueCard, ModuleProgressList, StatsRow } from '@/components/progress/dashboard';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  const outline = getOutline();
  const exerciseCount = lessons.reduce((n, l) => n + l.exercises.length, 0);

  const howItWorks = [
    { icon: BookOpenText, title: 'Baca materi', body: 'Penjelasan lengkap dengan contoh kode langsung di halaman, tanpa harus pindah situs.' },
    { icon: ListChecks, title: 'Kerjakan latihan', body: `${exerciseCount} soal dinilai otomatis: pilihan ganda, isian, urutan, dan menulis kode.` },
    { icon: FlaskConical, title: 'Coba di lab', body: 'Simulasi REST API, strategi SOLID, circuit breaker, dan perintah container.' },
    { icon: Library, title: 'Cek sumber asli', body: `${sources.length} referensi resmi dikutip di setiap materi untuk pendalaman.` },
  ];

  return (
    <PageContainer>
      <header className="mb-8">
        <p className="mb-2 text-sm font-semibold text-accent-text">Java · Spring Boot · Microservices</p>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">Dari satu object sampai banyak service yang berjalan di container.</h1>
        <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-fg-muted">
          {modules.length} modul berurutan: OOP dan SOLID, Spring Boot, microservices, Docker/Podman, hingga pengenalan OpenShift. Materi selesai ketika latihannya benar.
        </p>
      </header>

      <div className="space-y-8">
        <ContinueCard outline={outline} />
        <StatsRow outline={outline} />

        <section aria-labelledby="path-title" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 id="path-title" className="text-xl font-semibold tracking-tight">Jalur belajar</h2>
                <p className="text-sm text-fg-muted">{categories.join(' → ')}</p>
              </div>
              <Link href="/modules/" className="flex items-center gap-1 text-sm font-medium text-accent-text hover:underline">
                Semua modul <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ModuleProgressList outline={outline} />
          </div>

          <aside aria-labelledby="how-title">
            <h2 id="how-title" className="mb-4 text-xl font-semibold tracking-tight">Cara belajar di sini</h2>
            <ol className="space-y-3">
              {howItWorks.map(({ icon: Icon, title, body }, i) => (
                <li key={title}>
                  <Card className="flex gap-3 p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-medium"><span className="sr-only">Langkah {i + 1}: </span>{title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-fg-muted">{body}</p>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          </aside>
        </section>
      </div>
    </PageContainer>
  );
}
