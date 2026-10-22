import { Compass } from 'lucide-react';
import { LinkButton } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <Compass className="size-10 text-fg-subtle" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-fg-muted">Tautan mungkin sudah berubah. Kembali ke jalur belajar untuk mencari materinya.</p>
      <div className="mt-6 flex gap-2">
        <LinkButton href="/modules/">Jalur belajar</LinkButton>
        <LinkButton href="/" variant="secondary">Beranda</LinkButton>
      </div>
    </div>
  );
}
