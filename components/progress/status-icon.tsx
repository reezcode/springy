import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { cn } from '@/lib/cn';

export type LessonState = 'complete' | 'started' | 'todo';

export function StatusIcon({ state, className }: { state: LessonState; className?: string }) {
  const label = { complete: 'Selesai', started: 'Sedang dikerjakan', todo: 'Belum dimulai' }[state];
  const Icon = state === 'complete' ? CheckCircle2 : state === 'started' ? CircleDot : Circle;
  return (
    <span className={cn('inline-flex', className)} title={label}>
      <Icon aria-hidden="true" className={cn('size-5', state === 'complete' ? 'text-success' : state === 'started' ? 'text-accent' : 'text-border-strong')} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
