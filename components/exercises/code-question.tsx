'use client';

import { Check, Eye, EyeOff, RotateCcw, X } from 'lucide-react';
import { useId, useState } from 'react';
import type { CodeExercise } from '@/content/types';
import { gradeCode, type CheckResult } from '@/lib/grading';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/content/code-block';
import { InlineMarkdown } from '@/components/content/markdown';
import { Feedback, Prompt, SolvedNote } from './feedback';

type Props = { exercise: CodeExercise; solved: boolean; onResult: (ok: boolean) => void };

/** Attempts before the reference solution can be revealed. */
const REVEAL_AFTER = 2;

export function CodeQuestion({ exercise, solved, onResult }: Props) {
  const id = useId();
  const [code, setCode] = useState(exercise.starter);
  const [result, setResult] = useState<{ passed: boolean; checks: CheckResult[] } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  function check() {
    const graded = gradeCode(exercise, code);
    setResult({ passed: graded.passed, checks: graded.checks ?? [] });
    setAttempts((n) => n + 1);
    onResult(graded.passed);
  }

  // Tab inserts two spaces instead of moving focus; Escape then Tab leaves the editor.
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab' && !e.shiftKey && !e.currentTarget.dataset.escaped) {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: start, selectionEnd: end } = el;
      const next = `${code.slice(0, start)}  ${code.slice(end)}`;
      setCode(next);
      requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
    } else if (e.key === 'Escape') {
      e.currentTarget.dataset.escaped = '1';
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      check();
    }
  }

  const lines = code.split('\n').length;

  return (
    <div>
      <label htmlFor={id} className="block">
        <Prompt text={exercise.prompt} />
      </label>
      <p className="mt-1 text-sm text-fg-muted">
        Jawaban diperiksa dengan aturan statis terhadap kode (komentar diabaikan), bukan dengan menjalankan JVM. Tekan <kbd className="rounded border border-border bg-subtle px-1 font-mono text-xs">Ctrl/⌘ + Enter</kbd> untuk memeriksa.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-black/10 bg-code-bg dark:border-border">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-white/60">
          <span className="font-mono">Editor · {exercise.language}</span>
          <button
            type="button"
            onClick={() => {
              setCode(exercise.starter);
              setResult(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="size-3.5" /> Kembalikan kode awal
          </button>
        </div>
        <div className="flex">
          <div aria-hidden="true" className="select-none border-r border-white/5 py-4 pr-3 pl-4 text-right font-mono text-[0.8125rem] leading-relaxed text-white/30">
            {Array.from({ length: lines }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            id={id}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setResult(null);
            }}
            onKeyDown={onKeyDown}
            onBlur={(e) => delete e.currentTarget.dataset.escaped}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={Math.max(8, lines + 1)}
            className="min-w-0 flex-1 resize-y bg-transparent p-4 font-mono text-[0.8125rem] leading-relaxed whitespace-pre text-code-fg caret-white focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={check}>Periksa kode</Button>
        {attempts >= REVEAL_AFTER && !result?.passed && (
          <Button variant="ghost" onClick={() => setShowSolution((s) => !s)}>
            {showSolution ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {showSolution ? 'Sembunyikan contoh solusi' : 'Lihat contoh solusi'}
          </Button>
        )}
      </div>

      {result && (
        <Feedback ok={result.passed} title={result.passed ? 'Semua pemeriksaan lulus!' : `${result.checks.filter((c) => c.ok).length}/${result.checks.length} pemeriksaan lulus`} explanation={result.passed ? exercise.explanation : undefined}>
          <ul className="mt-2 space-y-1.5">
            {result.checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                {c.ok ? <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" /> : <X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />}
                <span className={cn('min-w-0', c.ok ? 'text-fg-muted' : 'text-fg')}>
                  <span className="sr-only">{c.ok ? 'Lulus: ' : 'Belum: '}</span>
                  <InlineMarkdown text={c.label} />
                  {!c.ok && (
                    <span className="block text-fg-muted">
                      <InlineMarkdown text={c.hint} />
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Feedback>
      )}

      {showSolution && !result?.passed && (
        <div className="mt-4">
          <CodeBlock code={exercise.solution} lang={exercise.language} title="Contoh solusi · bandingkan, lalu tulis ulang dengan caramu" />
        </div>
      )}
      {solved && !result && <SolvedNote />}
    </div>
  );
}
