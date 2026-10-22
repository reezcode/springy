'use client';

import { Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { request, type ApiState } from '@/lib/labs';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { SourceLink } from '@/components/content/source-link';
import { AsideCard, Field, LabHeading, LabLayout, fieldClass } from './lab-ui';

const emptyState: ApiState = { orders: [], keys: {} };

export function ApiLab() {
  const [state, setState] = useState<ApiState>(emptyState);
  const [method, setMethod] = useState('POST');
  const [path, setPath] = useState('/orders');
  const [body, setBody] = useState('{\n  "product": "Mechanical keyboard",\n  "quantity": 1\n}');
  const [auth, setAuth] = useState(true);
  const [key, setKey] = useState('order-demo-1');
  const [result, setResult] = useState<{ status: number; data: unknown } | null>(null);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const r = request(state, method, path, body, auth, key);
    setState(r.next);
    setResult(r);
  }

  return (
    <LabLayout
      main={
        <form onSubmit={send} className="space-y-5">
          <LabHeading title="Request studio" badge="SIMULASI">
            Buat order, lalu kirim request yang sama dua kali. Perhatikan ID dan jumlah order.
          </LabHeading>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select aria-label="HTTP method" value={method} onChange={(e) => setMethod(e.target.value)} className={cn(fieldClass, 'font-mono sm:w-28')}>
              <option>POST</option>
              <option>GET</option>
            </select>
            <input aria-label="Endpoint" value={path} onChange={(e) => setPath(e.target.value)} className={cn(fieldClass, 'flex-1 font-mono')} />
            <Button type="submit"><Play className="size-4" /> Kirim</Button>
          </div>
          <Field label="Request body (JSON)">
            <textarea maxLength={20_000} value={body} onChange={(e) => setBody(e.target.value)} spellCheck={false} rows={5} className={cn(fieldClass, 'h-auto py-2 font-mono')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Idempotency-Key">
              <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Kosongkan untuk menonaktifkan" className={cn(fieldClass, 'font-mono')} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
              <input type="checkbox" checked={auth} onChange={(e) => setAuth(e.target.checked)} className="size-4 accent-[var(--color-accent)]" />
              Kirim token valid (simulasi)
            </label>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Response</span>
              {result && (
                <span className={cn('rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold', result.status < 300 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
                  HTTP {result.status}
                </span>
              )}
            </div>
            <pre aria-live="polite" className="min-h-28 overflow-x-auto rounded-xl bg-code-bg p-4 font-mono text-[0.8125rem] leading-relaxed text-code-fg">
              {result ? JSON.stringify(result.data, null, 2) : '// Kirim request untuk melihat response.'}
            </pre>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setState(emptyState); setResult(null); }}>
            <RotateCcw className="size-4" /> Reset data lab
          </Button>
        </form>
      }
      aside={
        <>
          <AsideCard title="Eksperimen yang bisa dicoba">
            <ol>
              <li>Kirim POST yang valid: hasilnya 201.</li>
              <li>Kirim lagi dengan key sama: 200, <code>replayed: true</code>.</li>
              <li>Ubah quantity, pertahankan key: 409.</li>
              <li>Ganti quantity menjadi 0: 400.</li>
              <li>Matikan token: 401.</li>
              <li>GET <code>/orders</code> atau <code>/orders/1</code>.</li>
            </ol>
            <p className="rounded-lg bg-subtle px-3 py-2"><b className="text-lg tabular-nums">{state.orders.length}</b> order di memori lab</p>
            <p className="text-xs">Status replay 200 adalah kontrak latihan. Produksi butuh penyimpanan atomik, scope key, dan kebijakan retensi.</p>
          </AsideCard>
          <SourceLink id="validation" />
          <SourceLink id="retry" />
        </>
      }
    />
  );
}
