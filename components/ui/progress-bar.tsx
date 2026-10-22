import { cn } from '@/lib/cn';

export function ProgressBar({ value, label, className, tone = 'accent' }: { value: number; label: string; className?: string; tone?: 'accent' | 'success' }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', tone === 'success' ? 'bg-success' : 'bg-accent')} style={{ width: `${v}%` }} />
    </div>
  );
}
