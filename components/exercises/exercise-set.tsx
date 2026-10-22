'use client';

import { CheckCircle2, CircleDashed, RotateCcw, Trophy } from 'lucide-react';
import { useState } from 'react';
import type { Exercise } from '@/content/types';
import { useProgress } from '@/hooks/use-progress';
import { exerciseKey } from '@/lib/progress/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ChoiceQuestion } from './choice-question';
import { FillQuestion } from './fill-question';
import { CodeQuestion } from './code-question';
import { OrderQuestion } from './order-question';

const kindLabel: Record<Exercise['kind'], string> = {
  choice: 'Pilihan ganda',
  fill: 'Isian singkat',
  code: 'Tulis kode',
  order: 'Urutkan langkah',
};

export function ExerciseSet({ lessonId, exercises }: { lessonId: string; exercises: Exercise[] }) {
  const { progress, hydrated, actions } = useProgress();
  // Bumped on reset so every question remounts with empty local answers.
  const [round, setRound] = useState(0);
  const records = exercises.map((e) => progress.exercises[exerciseKey(lessonId, e.id)]);
  const passed = records.filter((r) => r?.passed).length;
  const complete = hydrated && passed === exercises.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-subtle px-4 py-3">
        <div className="min-w-40 flex-1">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-medium">Progres latihan</span>
            <span className="text-fg-muted tabular-nums">{hydrated ? passed : 0}/{exercises.length} benar</span>
          </div>
          <ProgressBar value={hydrated ? (passed / exercises.length) * 100 : 0} label="Progres latihan materi ini" tone={complete ? 'success' : 'accent'} />
        </div>
        {hydrated && records.some(Boolean) && (
          <Button variant="ghost" size="sm" onClick={() => {
              actions.resetLesson(lessonId);
              setRound((r) => r + 1);
            }}>
            <RotateCcw className="size-4" /> Ulangi latihan
          </Button>
        )}
      </div>

      {complete && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-success">
          <Trophy className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            <b>Materi selesai.</b> Semua latihan sudah benar dan tercatat di progresmu.
          </p>
        </div>
      )}

      <ol className="space-y-5">
        {exercises.map((exercise, i) => {
          const record = records[i];
          const onResult = (ok: boolean) => actions.recordAttempt(lessonId, exercise.id, ok);
          const key = `${exercise.id}-${round}`;
          return (
            <li key={exercise.id} className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-fg-subtle tabular-nums">Soal {i + 1}</span>
                <Badge>{kindLabel[exercise.kind]}</Badge>
                {hydrated && record?.passed ? (
                  <Badge tone="success"><CheckCircle2 /> Benar</Badge>
                ) : hydrated && record ? (
                  <Badge tone="warning"><CircleDashed /> {record.attempts}× dicoba</Badge>
                ) : null}
              </div>
              {exercise.kind === 'choice' && <ChoiceQuestion key={key} exercise={exercise} solved={Boolean(record?.passed)} onResult={onResult} />}
              {exercise.kind === 'fill' && <FillQuestion key={key} exercise={exercise} solved={Boolean(record?.passed)} onResult={onResult} />}
              {exercise.kind === 'code' && <CodeQuestion key={key} exercise={exercise} solved={Boolean(record?.passed)} onResult={onResult} />}
              {exercise.kind === 'order' && <OrderQuestion key={key} exercise={exercise} solved={Boolean(record?.passed)} onResult={onResult} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
