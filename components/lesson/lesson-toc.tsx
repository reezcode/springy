'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/** "On this page" navigation with scroll-spy. */
export function LessonToc({ items }: { items: { id: string; text: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    // Active = last heading scrolled above the reading line. Works for fast scrolls and jumps.
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = items[0]?.id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= 140) current = item.id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atBottom ? items[items.length - 1]?.id : current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav aria-label="Di halaman ini">
      <p className="mb-3 text-xs font-semibold tracking-wide text-fg-subtle uppercase">Di halaman ini</p>
      <ul className="space-y-1 border-l border-border text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? 'location' : undefined}
              className={cn(
                '-ml-px block border-l-2 py-1 pl-3 transition-colors',
                active === item.id ? 'border-accent font-medium text-accent-text' : 'border-transparent text-fg-muted hover:text-fg',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
