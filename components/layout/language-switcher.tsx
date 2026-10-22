'use client';

import { usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';

/** Both languages use the same lesson slugs and progress IDs. */
export function LanguageSwitcher() {
  const pathname = usePathname() ?? '/';
  const english = pathname === '/en' || pathname.startsWith('/en/');
  const path = english ? pathname.slice(3) || '/' : pathname;
  const base = path.endsWith('/') ? path : `${path}/`;

  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <span className="flex items-center gap-1.5 text-xs text-fg-muted">
        <Languages className="size-3.5" aria-hidden="true" />
        {english ? 'Language' : 'Bahasa'}
      </span>
      <nav aria-label={english ? 'Choose language' : 'Pilih bahasa'} className="inline-flex rounded-lg border border-border bg-subtle p-0.5 text-xs font-medium">
        {[
          { lang: 'id', label: 'ID', href: base, active: !english },
          { lang: 'en', label: 'EN', href: `/en${base}`, active: english },
        ].map(({ lang, label, href, active }) => (
          <a
            key={lang}
            href={href}
            hrefLang={lang}
            lang={lang}
            aria-label={lang === 'id' ? 'Bahasa Indonesia' : 'English'}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-2.5 py-1.5 transition-colors ${active ? 'bg-surface text-fg shadow-card' : 'text-fg-muted hover:text-fg'}`}
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
