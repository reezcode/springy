import { highlight } from '@/lib/highlight';
import { cn } from '@/lib/cn';
import { CopyButton } from './copy-button';

const languageLabel: Record<string, string> = {
  java: 'Java',
  yaml: 'YAML',
  yml: 'YAML',
  shell: 'Terminal',
  bash: 'Terminal',
  sh: 'Terminal',
  dockerfile: 'Dockerfile',
  properties: 'Properties',
  http: 'HTTP',
  json: 'JSON',
  text: 'Teks',
  sql: 'SQL',
};

export function CodeBlock({ code, lang = 'text', title, className }: { code: string; lang?: string; title?: string; className?: string }) {
  const tokens = highlight(code, lang);
  return (
    <figure className={cn('not-prose overflow-hidden rounded-xl border border-black/10 bg-code-bg text-code-fg dark:border-border', className)}>
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2 text-xs text-white/60">
        <span className="truncate font-mono">{title ?? languageLabel[lang] ?? lang}</span>
        <CopyButton text={code} />
      </figcaption>
      <pre className="overflow-x-auto p-4 text-[0.8125rem] leading-relaxed">
        <code className="font-mono">
          {tokens.map((t, i) => (t.kind === 'plain' ? t.text : <span key={i} className={`tok-${t.kind}`}>{t.text}</span>))}
        </code>
      </pre>
    </figure>
  );
}
