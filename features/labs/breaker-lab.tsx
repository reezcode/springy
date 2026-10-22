'use client';

import { Check, Clock, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { advanceBreaker, breakerCall, initialBreaker, type Breaker } from '@/lib/labs';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { SourceLink } from '@/components/content/source-link';
import { AsideCard, LabHeading, LabLayout } from './lab-ui';

const phases = ['CLOSED', 'OPEN', 'HALF_OPEN'] as const;
const phaseTone = { CLOSED: 'bg-success-soft text-success border-success/40', OPEN: 'bg-danger-soft text-danger border-danger/40', HALF_OPEN: 'bg-warning-soft text-warning border-warning/40' };

export function BreakerLab() {
  const [b, setB] = useState<Breaker>(initialBreaker);
  const [history, setHistory] = useState<string[]>([]);

  const log = (line: string) => setHistory((h) => [line, ...h].slice(0, 10));
  const call = (success: boolean) => {
    const r = breakerCall(b, success);
    setB(r.next);
    log(`${b.clock}s · ${r.message}`);
  };

  return (
    <LabLayout
      main={
        <>
          <LabHeading title="Saat dependency mulai gagal" badge="WAKTU VIRTUAL">
            Window 4 call · minimum 4 · ambang gagal 50% · OPEN selama 10s · 1 probe saat HALF_OPEN.
          </LabHeading>
          <div className="grid grid-cols-3 gap-2" aria-label="State circuit breaker">
            {phases.map((p) => (
              <div key={p} aria-current={b.phase === p ? 'true' : undefined} className={cn('rounded-xl border px-3 py-3 text-center font-mono text-sm font-semibold transition-colors', b.phase === p ? phaseTone[p] : 'border-border text-fg-subtle')}>
                {p.replace('_', ' ')}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2" aria-label="Sliding window">
            {Array.from({ length: 4 }, (_, i) => {
              const v = b.calls[i];
              return (
                <div key={i} className={cn('flex flex-col items-center gap-1 rounded-xl border py-3', v === undefined ? 'border-dashed border-border-strong text-fg-subtle' : v ? 'border-success/40 bg-success-soft text-success' : 'border-danger/40 bg-danger-soft text-danger')}>
                  {v === undefined ? <span className="text-lg">?</span> : v ? <Check className="size-5" /> : <X className="size-5" />}
                  <span className="text-xs">Call {i + 1}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => call(true)}><Check className="size-4" /> Call berhasil</Button>
            <Button variant="secondary" onClick={() => call(false)}><X className="size-4" /> Call gagal</Button>
            <Button
              variant="secondary"
              onClick={() => {
                const next = advanceBreaker(b);
                setB(next);
                log(`${next.clock}s · Waktu maju 10 detik. State: ${next.phase}`);
              }}
            >
              <Clock className="size-4" /> Maju 10s
            </Button>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm"><span className="font-medium">Event log</span><span className="text-fg-muted tabular-nums">{b.clock}s virtual</span></div>
            <div aria-live="polite" className="min-h-28 space-y-1 rounded-xl bg-code-bg p-4 font-mono text-[0.8125rem] text-code-fg">
              {history.length ? history.map((h, i) => <p key={i} className={i ? 'opacity-60' : ''}>{h}</p>) : <p className="opacity-60">Kirim 2 call berhasil dan 2 call gagal untuk membuka circuit.</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setB(initialBreaker); setHistory([]); }}><RotateCcw className="size-4" /> Reset eksperimen</Button>
        </>
      }
      aside={
        <>
          <AsideCard title="Ikuti siklusnya">
            <ol>
              <li>Mulai CLOSED: semua call diteruskan.</li>
              <li>Setelah 4 sampel, ≥50% gagal membuatnya OPEN.</li>
              <li>Saat OPEN, call ditolak tanpa memanggil dependency.</li>
              <li>Klik Maju 10s untuk pindah ke HALF_OPEN.</li>
              <li>Probe berhasil → CLOSED. Probe gagal → OPEN lagi.</li>
            </ol>
            <p className="text-xs">Model disederhanakan: satu call pada satu waktu, tanpa slow-call threshold. Bukan Resilience4j yang berjalan.</p>
          </AsideCard>
          <SourceLink id="cb" />
        </>
      }
    />
  );
}
