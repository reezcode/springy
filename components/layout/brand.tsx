import Link from 'next/link';
import { Route } from 'lucide-react';

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 rounded-lg text-lg font-bold tracking-tight text-fg">
      <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
        <Route className="size-4.5" aria-hidden="true" />
      </span>
      springpath
    </Link>
  );
}
