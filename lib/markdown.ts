/**
 * Parser for the small markdown subset used in lesson bodies.
 *
 * Supported blocks: `## h2`, `### h3`, paragraphs, `-`/`1.` lists, fenced code
 * (```java title="Order.java"), callouts (`> [!TIP] Optional title`) and
 * pipe tables. Inline: `code`, **bold**, *italic*, [text](https://url).
 *
 * Output is a plain AST rendered by components/content/markdown.tsx, so no
 * HTML string is ever injected into the page.
 */

export type Inline =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'link'; href: string; children: Inline[] };

export type CalloutTone = 'note' | 'tip' | 'warning';

export type Block =
  | { type: 'heading'; level: 2 | 3; id: string; text: string }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'code'; lang: string; title?: string; code: string }
  | { type: 'callout'; tone: CalloutTone; title?: string; blocks: Block[] }
  | { type: 'table'; head: Inline[][]; rows: Inline[][][] };

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[`*_]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const pattern = /`([^`]+)`|\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  for (let m = pattern.exec(text); m; m = pattern.exec(text)) {
    if (m.index > last) out.push({ type: 'text', value: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: 'code', value: m[1] });
    else if (m[2] !== undefined) out.push({ type: 'strong', children: parseInline(m[2]) });
    else if (m[3] !== undefined) out.push({ type: 'em', children: parseInline(m[3]) });
    else out.push({ type: 'link', href: m[5], children: parseInline(m[4]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) });
  return out;
}

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => parseInline(cell.trim()));

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  const usedIds = new Map<string, number>();
  let i = 0;

  const uniqueId = (text: string) => {
    const base = slugify(text) || 'bagian';
    const n = usedIds.get(base) ?? 0;
    usedIds.set(base, n + 1);
    return n ? `${base}-${n + 1}` : base;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const fence = trimmed.match(/^```(\w*)(?:\s+title="([^"]+)")?\s*$/);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '```') body.push(lines[i++]);
      i++; // closing fence
      blocks.push({ type: 'code', lang: fence[1] || 'text', title: fence[2], code: dedent(body).join('\n') });
      continue;
    }

    const heading = trimmed.match(/^(##|###)\s+(.+)$/);
    if (heading) {
      const text = heading[2].trim();
      blocks.push({ type: 'heading', level: heading[1].length as 2 | 3, id: uniqueId(text), text });
      i++;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const body: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) body.push(lines[i++].trim().replace(/^>\s?/, ''));
      const marker = body[0]?.match(/^\[!(NOTE|TIP|WARNING)\]\s*(.*)$/i);
      const tone = (marker?.[1].toLowerCase() ?? 'note') as CalloutTone;
      if (marker) body.shift();
      blocks.push({ type: 'callout', tone, title: marker?.[2] || undefined, blocks: parseMarkdown(body.join('\n')) });
      continue;
    }

    if (trimmed.startsWith('|') && lines[i + 1]?.trim().match(/^\|?\s*:?-{2,}/)) {
      const head = splitRow(trimmed);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]));
      blocks.push({ type: 'table', head, rows });
      continue;
    }

    const listItem = /^(?:[-*]|\d+\.)\s+/;
    if (listItem.test(trimmed)) {
      const ordered = /^\d+\./.test(trimmed);
      const items: Inline[][] = [];
      while (i < lines.length && listItem.test(lines[i].trim())) {
        let text = lines[i++].trim().replace(listItem, '');
        // Indented continuation lines belong to the current item.
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !listItem.test(lines[i].trim())) text += ` ${lines[i++].trim()}`;
        items.push(parseInline(text));
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|##|>|\|)/.test(lines[i].trim()) && !listItem.test(lines[i].trim())) {
      para.push(lines[i++].trim());
    }
    blocks.push({ type: 'paragraph', children: parseInline(para.join(' ')) });
  }
  return blocks;
}

function dedent(lines: string[]) {
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min));
}

export function extractHeadings(source: string) {
  return parseMarkdown(source).filter((b): b is Extract<Block, { type: 'heading' }> => b.type === 'heading' && b.level === 2);
}
