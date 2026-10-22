'use client';

import { Menu, X } from 'lucide-react';
import { useRef } from 'react';
import type { Outline } from '@/content';
import { Brand } from './brand';
import { SearchTrigger } from './search-dialog';
import { SidebarContent } from './sidebar';

/** Top bar + slide-in drawer for small screens. Uses <dialog> for focus trapping and Esc handling. */
export function MobileNav({ outline }: { outline: Outline }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur lg:hidden">
      <button type="button" onClick={() => dialog.current?.showModal()} aria-label="Buka menu" className="-ml-2 rounded-lg p-2 text-fg-muted hover:bg-subtle hover:text-fg">
        <Menu className="size-5" />
      </button>
      <Brand />
      <SearchTrigger compact />
      <dialog
        ref={dialog}
        aria-label="Menu navigasi"
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-0 h-dvh max-h-none w-[85vw] max-w-xs bg-surface p-0 text-fg backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <button type="button" onClick={close} aria-label="Tutup menu" className="absolute top-4 right-3 z-10 rounded-lg p-2 text-fg-muted hover:bg-subtle hover:text-fg">
          <X className="size-5" />
        </button>
        <SidebarContent outline={outline} onNavigate={close} />
      </dialog>
    </header>
  );
}
