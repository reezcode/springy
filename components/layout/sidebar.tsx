'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Outline } from '@/content';
import { useProgress } from '@/hooks/use-progress';
import { overallStatus } from '@/lib/progress/selectors';
import { cn } from '@/lib/cn';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Brand } from './brand';
import { navItems } from './nav-items';
import { SearchTrigger } from './search-dialog';
import { ThemeToggle } from './theme-toggle';

export function SidebarContent({ outline, onNavigate }: { outline: Outline; onNavigate?: () => void }) {
  const pathname = usePathname() ?? '/';
  const { progress, hydrated } = useProgress();
  const overall = overallStatus(progress, outline);

  return (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <div className="px-2">
        <Brand />
      </div>

      <SearchTrigger className="w-full" />

      <nav aria-label="Navigasi utama">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                    active ? 'bg-accent-soft text-accent-text' : 'text-fg-muted hover:bg-subtle hover:text-fg',
                  )}
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-xl border border-border bg-subtle p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">Progres belajar</p>
            <p className="text-sm text-fg-muted tabular-nums">{hydrated ? overall.percent : 0}%</p>
          </div>
          <ProgressBar className="mt-2.5" value={hydrated ? overall.percent : 0} label="Progres keseluruhan" />
          <p className="mt-2.5 text-xs text-fg-muted">
            {hydrated ? overall.lessonsComplete : 0} dari {overall.lessonsTotal} materi lulus latihan
          </p>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-fg-subtle">Tema</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
