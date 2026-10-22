import Link from 'next/link';
import { ArrowRight, BookOpenText, FlaskConical, ListChecks, Library } from 'lucide-react';
import { categories, getOutline, lessons, modules, sources } from '@/content';
import { PageContainer } from '@/components/layout/page-header';
import { ContinueCard, ModuleProgressList, StatsRow } from '@/components/progress/dashboard';
import { AdventureDashboard } from '@/components/gamification/adventure-dashboard';
import { SpringyMascot } from '@/components/ui/springy-mascot';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  const outline = getOutline();
  const exerciseCount = lessons.reduce((n, l) => n + l.exercises.length, 0);

  const howItWorks = [
    { icon: BookOpenText, title: 'Baca materi', body: 'Baca penjelasan dan contoh kodenya, lalu coba di project-mu sendiri.' },
    { icon: ListChecks, title: 'Kerjakan latihan', body: `Ada ${exerciseCount} soal, dari pilihan ganda sampai menulis kode. Periksa jawabanmu langsung di halaman.` },
    { icon: FlaskConical, title: 'Coba di lab', body: 'Ubah input di playground dan lihat cara kerja REST API, SOLID, circuit breaker, dan container.' },
    { icon: Library, title: 'Cek sumber asli', body: `Buka dokumentasi yang dirujuk di tiap materi. Ada ${sources.length} referensi untuk dibaca lebih lanjut.` },
  ];

  return (
    <PageContainer>
      <header className="mb-8 flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-8">
        <div>
          <p className="mb-2 text-sm font-semibold text-accent-text">Java · Spring Boot · Microservices</p>
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">Belajar Java dan Spring Boot dari dasar.</h1>
          <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-fg-muted">
            Mulai dari OOP dan SOLID, lalu buat REST API, pelajari microservices, dan jalankan aplikasimu di container. Ada {modules.length} modul yang bisa kamu ikuti sesuai urutan atau pilih sendiri.
          </p>
        </div>
        <SpringyMascot className="w-20 sm:w-36 lg:w-44" />
      </header>

      <div className="space-y-8">
        <ContinueCard outline={outline} />
        <AdventureDashboard outline={outline} />
        <StatsRow outline={outline} />

        <section aria-labelledby="path-title" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0 basis-64 flex-1">
                <h2 id="path-title" className="text-xl font-semibold tracking-tight">Learning path</h2>
                <p className="text-sm text-fg-muted">{categories.join(' → ')}</p>
              </div>
              <Link href="/modules/" className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent-text hover:underline">
                Semua modul <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ModuleProgressList outline={outline} />
          </div>

          <aside aria-labelledby="how-title">
            <h2 id="how-title" className="mb-4 text-xl font-semibold tracking-tight">Belajar di Springy</h2>
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
