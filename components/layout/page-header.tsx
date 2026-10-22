import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-sm font-semibold text-accent-text">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-[2.1rem]">{title}</h1>
        {description && <p className="mt-3 text-[1.05rem] leading-relaxed text-pretty text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  );
}

export function PageContainer({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-10 ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}>{children}</div>;
}
