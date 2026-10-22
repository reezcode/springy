'use client';

import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { CodeBlock } from '@/components/content/code-block';
import { SourceLink } from '@/components/content/source-link';
import { AsideCard, Field, LabHeading, LabLayout, fieldClass } from './lab-ui';

const policies = {
  regular: { label: 'Regular · 0%', impl: 'NoDiscount', rate: 0 },
  member: { label: 'Member · 10%', impl: 'MemberDiscount', rate: 0.1 },
  promo: { label: 'Promo · 20%', impl: 'PromoDiscount', rate: 0.2 },
};
const gateways = { bank: { label: 'Bank gateway', impl: 'BankGateway' }, fake: { label: 'Fake gateway untuk test', impl: 'FakeGateway' } };

const money = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export function SolidLab() {
  const [policy, setPolicy] = useState<keyof typeof policies>('regular');
  const [gateway, setGateway] = useState<keyof typeof gateways>('bank');
  const [amount, setAmount] = useState('100000');
  const n = Number(amount);
  const valid = amount.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 1e12;
  const rate = policies[policy].rate;

  return (
    <LabLayout
      main={
        <>
          <LabHeading title="Ganti strategi, pertahankan alurnya" badge="MODEL KONSEP">
            Checkout memakai kontrak DiscountPolicy dan PaymentGateway. Ganti implementasinya dan lihat alur Checkout tetap sama.
          </LabHeading>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Subtotal (Rp)">
              <input type="number" inputMode="numeric" min={0} max={1e12} value={amount} onChange={(e) => setAmount(e.target.value)} className={fieldClass} />
            </Field>
            <Field label="Discount policy">
              <select value={policy} onChange={(e) => setPolicy(e.target.value as keyof typeof policies)} className={fieldClass}>
                {Object.entries(policies).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Payment gateway">
              <select value={gateway} onChange={(e) => setGateway(e.target.value as keyof typeof gateways)} className={fieldClass}>
                {Object.entries(gateways).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-sm" aria-label="Alur checkout">
            {['Checkout', policies[policy].impl, gateways[gateway].impl].map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="size-4 text-fg-subtle" aria-hidden="true" />}
                <span className="rounded-lg border border-border bg-subtle px-3 py-1.5">{step}</span>
              </span>
            ))}
          </div>
          {valid ? (
            <dl aria-live="polite" className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-subtle p-4"><dt className="text-sm text-fg-muted">Diskon {rate * 100}%</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{money(n * rate)}</dd></div>
              <div className="rounded-xl bg-accent-soft p-4"><dt className="text-sm text-fg-muted">Total dibayar</dt><dd className="mt-1 text-xl font-bold text-accent-text tabular-nums">{money(n * (1 - rate))}</dd></div>
              <p className="text-sm text-fg-muted sm:col-span-2">{gateway === 'fake' ? 'Fake gateway merekam nilai untuk diperiksa test.' : 'Model bank gateway dipilih. Tidak ada pembayaran sungguhan.'}</p>
            </dl>
          ) : (
            <p role="alert" className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">Masukkan subtotal antara 0 dan 1 triliun.</p>
          )}
          <CodeBlock
            lang="java"
            title="Desain Java · tidak dikompilasi di lab"
            code={`interface DiscountPolicy { long apply(long subtotal); }\ninterface PaymentGateway { void charge(long amount); }\n\nfinal class Checkout {\n  private final DiscountPolicy policy;\n  private final PaymentGateway gateway;\n\n  // Dependency diberikan dari luar.\n  Checkout(DiscountPolicy policy, PaymentGateway gateway) {\n    this.policy = policy;\n    this.gateway = gateway;\n  }\n\n  // Alur ini tetap, walau strategi diganti.\n  void checkout(long subtotal) {\n    gateway.charge(policy.apply(subtotal));\n  }\n}`}
          />
        </>
      }
      aside={
        <>
          <AsideCard title="Apa yang diperhatikan?">
            <p><b>OCP:</b> diskon baru = implementasi baru, Checkout tidak diubah.</p>
            <p><b>DIP:</b> Checkout bergantung pada kontrak, bukan bank tertentu.</p>
            <p><b>SRP:</b> kalkulasi diskon tidak mengurus komunikasi pembayaran.</p>
            <p className="text-xs">OCP di sini berarti Open/Closed Principle. Pada modul deployment, OCP berarti OpenShift Container Platform.</p>
          </AsideCard>
          <SourceLink id="solid" />
          <SourceLink id="di" />
        </>
      }
    />
  );
}
