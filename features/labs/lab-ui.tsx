import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const fieldClass =
  'h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-fg focus:border-accent focus:outline-none';

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function LabLayout({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="min-w-0 space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">{main}</section>
      <aside className="space-y-4">{aside}</aside>
    </div>
  );
}

export function LabHeading({ title, badge, children }: { title: string; badge: string; children?: ReactNode }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <span className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-semibold tracking-wide text-fg-muted">{badge}</span>
      </div>
      {children && <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{children}</p>}
    </div>
  );
}

export function AsideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed shadow-card">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="space-y-2.5 text-fg-muted [&_b]:text-fg [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-subtle [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-fg">{children}</div>
    </div>
  );
}
