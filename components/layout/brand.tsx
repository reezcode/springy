import Link from 'next/link';

export function Brand() {
  return (
    <Link href="/" aria-label="Springy · Beranda" className="inline-flex items-center gap-2 rounded-lg text-xl font-bold tracking-tight text-fg">
      <img src="/favicon.svg" width={36} height={36} alt="" aria-hidden="true" />
      springy
    </Link>
  );
}
