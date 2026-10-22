import { AlertTriangle, Info, Lightbulb } from 'lucide-react';
import { Fragment } from 'react';
import { parseInline, parseMarkdown, type Block, type Inline } from '@/lib/markdown';
import { cn } from '@/lib/cn';
import { CodeBlock } from './code-block';

function Inlines({ nodes }: { nodes: Inline[] }) {
  return nodes.map((n, i) => {
    switch (n.type) {
      case 'text':
        return <Fragment key={i}>{n.value}</Fragment>;
      case 'code':
        return <code key={i}>{n.value}</code>;
      case 'strong':
        return <strong key={i}><Inlines nodes={n.children} /></strong>;
      case 'em':
        return <em key={i}><Inlines nodes={n.children} /></em>;
      case 'link':
        return (
          <a key={i} href={n.href} target="_blank" rel="noreferrer">
            <Inlines nodes={n.children} />
            <span className="sr-only"> (membuka tab baru)</span>
          </a>
        );
    }
  });
}

const callout = {
  note: { icon: Info, label: 'Catatan', className: 'border-info/30 bg-info-soft [&_.callout-icon]:text-info' },
  tip: { icon: Lightbulb, label: 'Tips', className: 'border-success/30 bg-success-soft [&_.callout-icon]:text-success' },
  warning: { icon: AlertTriangle, label: 'Perhatian', className: 'border-warning/30 bg-warning-soft [&_.callout-icon]:text-warning' },
};

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return block.level === 2 ? <h2 id={block.id}>{block.text}</h2> : <h3 id={block.id}>{block.text}</h3>;
    case 'paragraph':
      return <p><Inlines nodes={block.children} /></p>;
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return <Tag>{block.items.map((item, i) => <li key={i}><Inlines nodes={item} /></li>)}</Tag>;
    }
    case 'code':
      return <CodeBlock code={block.code} lang={block.lang} title={block.title} />;
    case 'callout': {
      const c = callout[block.tone];
      return (
        <aside className={cn('flex gap-3 rounded-xl border px-4 py-3.5 text-[0.95rem] leading-relaxed', c.className)}>
          <c.icon aria-hidden="true" className="callout-icon mt-1 size-[1.1rem] shrink-0" />
          <div className="min-w-0 space-y-2">
            <p className="font-semibold">{block.title ?? c.label}</p>
            {block.blocks.map((b, i) => <BlockView key={i} block={b} />)}
          </div>
        </aside>
      );
    }
    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-left text-[0.92rem]">
            <thead className="bg-subtle">
              <tr>{block.head.map((cell, i) => <th key={i} scope="col" className="border-b border-border px-4 py-2.5 font-semibold"><Inlines nodes={cell} /></th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-border last:border-0">
                  {row.map((cell, i) => <td key={i} className="px-4 py-2.5 align-top text-fg-muted"><Inlines nodes={cell} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn('prose-lesson', className)}>
      {parseMarkdown(source).map((block, i) => <BlockView key={i} block={block} />)}
    </div>
  );
}

/** Render inline markdown (code, bold, links) inside a single line of UI text. */
export function InlineMarkdown({ text }: { text: string }) {
  return <Inlines nodes={parseInline(text)} />;
}
