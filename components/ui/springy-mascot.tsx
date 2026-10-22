'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { cn } from '@/lib/cn';
import { useMotion } from '@/hooks/use-motion';

type Props = { className?: string; interactive?: boolean; happy?: boolean };
const greetings = ['Hai! Siap belajar bareng?', 'Satu soal dulu juga boleh.', 'Pelan-pelan, kamu pasti bisa.', 'Boing! Aku dukung kamu.'];

export function SpringyMascot({ className, interactive = true, happy = false }: Props) {
  const { enabled } = useMotion();
  const eyes = useRef<SVGGElement>(null);
  const [taps, setTaps] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!speaking) return;
    const timer = setTimeout(() => setSpeaking(false), 3500);
    return () => clearTimeout(timer);
  }, [taps, speaking]);

  function look(event: PointerEvent<HTMLButtonElement>) {
    if (!enabled || event.pointerType === 'touch') return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-3, Math.min(3, (event.clientX - box.left - box.width / 2) / box.width * 6));
    const y = Math.max(-2, Math.min(2, (event.clientY - box.top - box.height / 2) / box.height * 4));
    eyes.current?.style.setProperty('transform', `translate(${x}px, ${y}px)`);
  }

  const illustration = (
    <svg viewBox="0 0 160 180" fill="none" role="img" aria-label="Springy, maskot per kecil dengan senyum dan dua daun" className="block h-auto w-full overflow-visible">
      <ellipse className="springy-shadow" cx="80" cy="166" rx="43" ry="6" fill="#6D4BD8" opacity=".13" />
      <g key={taps} className={cn('springy-character', (speaking || happy) && 'springy-jump')}>
        <g stroke="#49318C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M61 149 54 160H40M99 149l7 11h14" />
          <path d="M42 100c-15 0-21-9-22-19m98 19c14 0 19-9 21-19" />
          <path d="m20 81-5-4m5 4 4-6m115 6 5-4m-5 4-4-6" />
        </g>
        <g stroke="#49318C" strokeWidth="4.5" strokeLinejoin="round">
          <path d="M43 116c0-10 74-10 74 0v25c0 17-74 17-74 0z" fill="#BBA5F4" />
          <ellipse cx="80" cy="116" rx="37" ry="12" fill="#E8DFFE" />
          <path d="M42 97c0-10 76-10 76 0v25c0 17-76 17-76 0z" fill="#BBA5F4" />
          <ellipse cx="80" cy="97" rx="38" ry="12" fill="#E8DFFE" />
          <path d="M41 78c0-10 78-10 78 0v25c0 17-78 17-78 0z" fill="#BBA5F4" />
          <ellipse cx="80" cy="78" rx="39" ry="12" fill="#E8DFFE" />
          <path d="M39 58c0-13 82-13 82 0v26c0 22-82 22-82 0z" fill="#CDBAF8" />
          <ellipse cx="80" cy="58" rx="41" ry="15" fill="#F0E9FF" />
        </g>
        <g className="springy-leaves">
          <path d="M80 43V31" stroke="#49318C" strokeWidth="4" strokeLinecap="round" />
          <path d="M79 34C63 35 60 24 61 18c13-1 23 4 18 16Z" fill="#A6DDB6" stroke="#49318C" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M80 32C79 18 90 12 101 14c-1 12-9 20-21 18Z" fill="#C5EAC3" stroke="#49318C" strokeWidth="3.5" strokeLinejoin="round" />
        </g>
        <g className="springy-blink">
          <g ref={eyes} className="springy-eyes" fill="#49318C">
            <ellipse cx="65" cy="77" rx="3.5" ry="5" />
            <ellipse cx="95" cy="77" rx="3.5" ry="5" />
          </g>
        </g>
        <path d={speaking || happy ? 'M72 82q8 13 16 0Z' : 'M75 83c2 5 8 5 10 0'} fill={speaking || happy ? '#49318C' : 'none'} stroke="#49318C" strokeWidth="3.5" strokeLinecap="round" />
        <g fill="#ED91AF" opacity=".8"><ellipse cx="55" cy="85" rx="6" ry="3.5" /><ellipse cx="105" cy="85" rx="6" ry="3.5" /></g>
      </g>
      <path className="springy-star" d="m128 34 3-7 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#E9BD65" />
    </svg>
  );

  if (!interactive) return <div className={cn('shrink-0', className)}>{illustration}</div>;
  return (
    <div className={cn('relative shrink-0', className)}>
      <button type="button" aria-label="Sapa Springy" onPointerMove={look} onPointerLeave={() => eyes.current?.style.removeProperty('transform')} onClick={() => { setTaps(n => n + 1); setSpeaking(true); }} className="springy-pet block w-full rounded-3xl focus-visible:outline-accent">
        {illustration}
      </button>
      <span role="status" className={cn('springy-speech absolute right-0 bottom-full z-10 mb-1 w-48 rounded-2xl rounded-br-sm border border-accent/20 bg-surface px-3 py-2 text-sm font-medium text-fg shadow-pop', !speaking && 'sr-only')}>
        {speaking ? greetings[(taps - 1) % greetings.length] : ''}
      </span>
    </div>
  );
}
