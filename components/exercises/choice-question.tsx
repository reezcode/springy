'use client';

import { useId, useState } from 'react';
import type { ChoiceExercise } from '@/content/types';
import { gradeChoice } from '@/lib/grading';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { InlineMarkdown } from '@/components/content/markdown';
import { Feedback, Prompt, SolvedNote } from './feedback';

type Props = { exercise: ChoiceExercise; solved: boolean; onResult: (ok: boolean) => void };

export function ChoiceQuestion({ exercise, solved, onResult }: Props) {
  const name = useId();
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState<{ ok: boolean; selected: number[] } | null>(null);
  const multiple = Boolean(exercise.multiple);

  function toggle(i: number) {
    setChecked(null);
    setSelected((s) => (multiple ? (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]) : [i]));
  }

  function check() {
    const { passed } = gradeChoice(exercise, selected);
    setChecked({ ok: passed, selected });
    onResult(passed);
  }

  return (
    <fieldset>
      <legend className="contents">
        <Prompt text={exercise.prompt} />
      </legend>
      {multiple && <p className="mt-1 text-sm text-fg-muted">Pilih semua jawaban yang benar.</p>}
      <div className="mt-4 space-y-2">
        {exercise.options.map((option, i) => {
          const isSelected = selected.includes(i);
          const reveal = checked?.ok && checked.selected.includes(i);
          const wrongPick = checked && !checked.ok && checked.selected.includes(i);
          return (
            <label
              key={i}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-[0.95rem] transition-colors',
                isSelected ? 'border-accent bg-accent-soft/60' : 'border-border hover:bg-subtle',
                reveal && 'border-success bg-success-soft',
                wrongPick && 'border-danger/60 bg-danger-soft',
              )}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                checked={isSelected}
                onChange={() => toggle(i)}
                className="mt-1 size-4 shrink-0 accent-[var(--color-accent)]"
              />
              <span className="min-w-0">
                <InlineMarkdown text={option.text} />
                {checked && checked.selected.includes(i) && option.why && (
                  <span className="mt-1 block text-sm text-fg-muted">
                    <InlineMarkdown text={option.why} />
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={check} disabled={!selected.length}>Periksa jawaban</Button>
      </div>
      {checked && <Feedback ok={checked.ok} explanation={checked.ok ? exercise.explanation : undefined} />}
      {solved && !checked && <SolvedNote />}
    </fieldset>
  );
}
