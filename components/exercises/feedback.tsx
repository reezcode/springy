import { CheckCircle2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { InlineMarkdown } from '@/components/content/markdown';
import { cn } from '@/lib/cn';

export function Feedback({ ok, title, explanation, children }: { ok: boolean; title?: string; explanation?: string; children?: ReactNode }) {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div role="status" className={cn('mt-4 rounded-xl border px-4 py-3 text-sm leading-relaxed', ok ? 'border-success/30 bg-success-soft' : 'border-danger/30 bg-danger-soft')}>
      <p className={cn('flex items-center gap-2 font-semibold', ok ? 'text-success' : 'text-danger')}>
        <Icon aria-hidden="true" className="size-4.5 shrink-0" />
        {title ?? (ok ? 'Benar!' : 'Belum tepat. Coba lagi.')}
      </p>
      {children}
      {explanation && (
        <p className="mt-2 text-fg">
          <InlineMarkdown text={explanation} />
        </p>
      )}
    </div>
  );
}

export function Prompt({ text }: { text: string }) {
  return (
    <p className="text-[1.02rem] leading-relaxed font-medium text-fg">
      <InlineMarkdown text={text} />
    </p>
  );
}

export function SolvedNote() {
  return <p className="mt-3 text-xs text-fg-subtle">Kamu sudah pernah menjawab soal ini dengan benar. Menjawab ulang tidak menghapus nilai.</p>;
}
