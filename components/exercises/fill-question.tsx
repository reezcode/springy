'use client';

import { useId, useState } from 'react';
import type { FillExercise } from '@/content/types';
import { gradeFill } from '@/lib/grading';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/content/code-block';
import { Feedback, Prompt, SolvedNote } from './feedback';

type Props = { exercise: FillExercise; solved: boolean; onResult: (ok: boolean) => void };

export function FillQuestion({ exercise, solved, onResult }: Props) {
  const id = useId();
  const [value, setValue] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);

  function check(e: React.FormEvent) {
    e.preventDefault();
    const { passed } = gradeFill(exercise, value);
    setResult(passed);
    setAttempts((n) => n + 1);
    onResult(passed);
  }

  return (
    <form onSubmit={check}>
      <label htmlFor={id} className="block">
        <Prompt text={exercise.prompt} />
      </label>
      {exercise.context && <CodeBlock code={exercise.context} lang="java" title="Lengkapi bagian ___" className="mt-4" />}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setResult(null);
          }}
          placeholder={exercise.placeholder ?? 'Ketik jawaban'}
          autoComplete="off"
          spellCheck={false}
          className="h-10 min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3 font-mono text-sm focus:border-accent focus:outline-none focus-visible:outline-2"
        />
        <Button type="submit" disabled={!value.trim()}>Periksa jawaban</Button>
      </div>
      {result !== null && (
        <Feedback ok={result} explanation={result ? exercise.explanation : undefined}>
          {!result && exercise.hint && attempts >= 1 && <p className="mt-1 text-fg">Petunjuk: {exercise.hint}</p>}
        </Feedback>
      )}
      {solved && result === null && <SolvedNote />}
    </form>
  );
}
