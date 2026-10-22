import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-fg-muted">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 text-fg-subtle" aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href} className="rounded hover:text-fg hover:underline">{item.label}</Link>
            ) : (
              <span aria-current="page" className="font-medium text-fg">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
