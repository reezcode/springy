'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { OrderExercise } from '@/content/types';
import { gradeOrder, seededShuffle } from '@/lib/grading';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { InlineMarkdown } from '@/components/content/markdown';
import { Feedback, Prompt, SolvedNote } from './feedback';

type Props = { exercise: OrderExercise; solved: boolean; onResult: (ok: boolean) => void };

export function OrderQuestion({ exercise, solved, onResult }: Props) {
  const initial = useMemo(() => seededShuffle(exercise.items, exercise.id), [exercise]);
  const [order, setOrder] = useState(initial);
  const [result, setResult] = useState<boolean | null>(null);
  const [announce, setAnnounce] = useState('');

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
    setResult(null);
    setAnnounce(`Dipindah ke posisi ${to + 1}.`);
  }

  function check() {
    const { passed } = gradeOrder(exercise, order);
    setResult(passed);
    onResult(passed);
  }

  const correctCount = order.filter((item, i) => item === exercise.items[i]).length;

  return (
    <div>
      <Prompt text={exercise.prompt} />
      <p className="mt-1 text-sm text-fg-muted">Gunakan tombol panah untuk mengubah urutan.</p>
      <ol className="mt-4 space-y-2">
        {order.map((item, i) => (
          <li
            key={item}
            className={cn(
              'flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-[0.95rem]',
              result === true && 'border-success/50 bg-success-soft',
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-subtle text-sm font-semibold text-fg-muted tabular-nums">{i + 1}</span>
            <span className="min-w-0 flex-1"><InlineMarkdown text={item} /></span>
            <span className="flex shrink-0 gap-1">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Naikkan langkah ${i + 1}`} className="rounded-md p-1.5 text-fg-muted hover:bg-subtle hover:text-fg disabled:opacity-30">
                <ArrowUp className="size-4" />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === order.length - 1} aria-label={`Turunkan langkah ${i + 1}`} className="rounded-md p-1.5 text-fg-muted hover:bg-subtle hover:text-fg disabled:opacity-30">
                <ArrowDown className="size-4" />
              </button>
            </span>
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">{announce}</p>
      <div className="mt-4">
        <Button onClick={check}>Periksa urutan</Button>
      </div>
      {result !== null && (
        <Feedback ok={result} explanation={result ? exercise.explanation : undefined}>
          {!result && <p className="mt-1 text-fg">{correctCount} dari {order.length} langkah sudah di posisi yang benar.</p>}
        </Feedback>
      )}
      {solved && result === null && <SolvedNote />}
    </div>
  );
}
