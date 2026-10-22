import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { modules } from '../content/index.ts';

const messages = JSON.parse(await readFile('content/en/ui.json', 'utf8'));
const lessonNotes = JSON.parse(await readFile('content/en/lesson-notes.json', 'utf8'));

async function write(file, text) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text);
}

function translate(text) {
  if (Object.hasOwn(messages, text)) return messages[text];
  const trimmed = text.trim();
  if (Object.hasOwn(messages, trimmed)) return text.replace(trimmed, messages[trimmed]);
  return text;
}

function route(text) {
  return /^\/(modules|playground|references|notes|settings)(\/|$)/.test(text) ? `/en${text}` : text;
}

function transform(source, filename) {
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, filename.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const changes = [];
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      let text = node.text;
      let result = route(translate(text));
      if (text.startsWith('@/') && !text.includes('language-switcher')) result = text.replace('@/', '@/.generated/en/');
      if (text === '/' && (ts.isJsxAttribute(node.parent) && node.parent.name.getText(tree) === 'href' || filename.endsWith('nav-items.ts') || ts.isLiteralTypeNode(node.parent))) result = ts.isLiteralTypeNode(node.parent) ? '/en' : '/en/';
      if (text === 'id' && ts.isJsxAttribute(node.parent) && node.parent.name.getText(tree) === 'lang') result = 'en';
      if (result !== text) {
        const escaped = result.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
        const replacement = ts.isStringLiteral(node) ? JSON.stringify(result) : ts.isNoSubstitutionTemplateLiteral(node) ? `\`${escaped}\`` : ts.isTemplateHead(node) ? `\`${escaped}\${` : ts.isTemplateTail(node) ? `}${escaped}\`` : `}${escaped}\${`;
        changes.push({ start: node.getStart(tree), end: node.end, text: replacement });
      }
    } else if (ts.isJsxText(node)) {
      const raw = node.getText(tree);
      const trimmed = raw.trim();
      if (Object.hasOwn(messages, trimmed)) changes.push({ start: node.getStart(tree), end: node.end, text: raw.replace(trimmed, messages[trimmed]) });
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  for (const c of changes.sort((a, b) => b.start - a.start)) source = source.slice(0, c.start) + c.text + source.slice(c.end);
  return source;
}

async function copyTree(from, to) {
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name), dest = path.join(to, entry.name);
    if (entry.isDirectory()) await copyTree(src, dest);
    else if (/\.(tsx?|css)$/.test(entry.name)) {
      let source = await readFile(src, 'utf8');
      if (/\.tsx?$/.test(entry.name)) source = transform(source, src);
      await write(dest, source);
    }
  }
}

await copyTree('app/(indonesian)', 'app/(english)/en');
// Each route group owns a root layout; both serve the same global stylesheet.
const layout = 'app/(english)/en/layout.tsx';
await write(layout, (await readFile(layout, 'utf8')).replace("'../globals.css'", "'../../globals.css'"));
for (const dir of ['components', 'features', 'hooks', 'lib', 'content']) {
  if (dir === 'content') continue;
  await copyTree(dir, `.generated/en/${dir}`);
}
for (const file of ['index.ts', 'types.ts', 'sources.ts']) {
  let source = transform(await readFile(`content/${file}`, 'utf8'), `content/${file}`);
  if (file === 'index.ts') source = source.replace("'content', 'lessons'", "'.generated', 'en', 'lessons'");
  await write(`.generated/en/content/${file}`, source);
}

// English overlays keep every slug, exercise ID, answer, regex, and code sample.
function localizeModule(original, english) {
  if (english.lessons.length !== original.lessons.length) throw new Error(`Lesson count differs: ${original.slug}`);
  return {
    ...original, title: english.title, subtitle: english.subtitle, description: english.description,
    category: ({ Fondasi: 'Foundations', Operasional: 'Operations', 'Proyek akhir': 'Final project' })[original.category] ?? original.category,
    lessons: original.lessons.map((l, i) => {
      const e = english.lessons[i];
      if (e.exercises.length !== l.exercises.length) throw new Error(`Exercise count differs: ${l.slug}`);
      return {
        ...l, title: e.title, summary: e.summary, objectives: e.objectives, keyPoints: e.keyPoints,
        practice: { task: e.practice[0], proof: e.practice[1] },
        refs: l.refs.map(r => ({ ...r, note: 'Official documentation and further reading.' })),
        exercises: l.exercises.map((q, j) => {
          const t = e.exercises[j];
          const result = { ...q, prompt: t.prompt, explanation: t.explanation };
          if (q.kind === 'choice') {
            if (t.options.length !== q.options.length) throw new Error(`Option count differs: ${q.id}`);
            result.options = q.options.map((o, k) => ({ ...o, text: t.options[k], ...(o.correct ? {} : { why: t.explanation }) }));
          }
          if (q.kind === 'order') {
            if (t.items.length !== q.items.length) throw new Error(`Step count differs: ${q.id}`);
            result.items = t.items;
          }
          if (q.kind === 'fill') { result.hint = t.hint; result.placeholder = t.placeholder ?? 'Your answer'; }
          if (q.kind === 'code') {
            if (t.checks.length !== q.checks.length) throw new Error(`Check count differs: ${q.id}`);
            result.checks = q.checks.map((c,k) => ({ ...c, label: t.checks[k], hint: `Check your code against this requirement: ${t.checks[k]}` }));
          }
          return result;
        }),
      };
    }),
  };
}
const moduleFiles = (await readdir('content/modules')).filter(f => f.endsWith('.ts')).sort();
for (let i=0; i<modules.length; i++) {
  const m = modules[i];
  const english = JSON.parse(await readFile(`content/en/modules/${m.slug}.json`, 'utf8'));
  const localized = localizeModule(m, english);
  delete localized.id;
  delete localized.number;
  for (const lesson of localized.lessons) delete lesson.id;
  await write(`.generated/en/content/modules/${moduleFiles[i]}`, `import type { ModuleInput } from '../types.ts';\nexport default ${JSON.stringify(localized, null, 2)} satisfies ModuleInput;\n`);
  for (let j=0; j<m.lessons.length; j++) {
    const lesson = m.lessons[j], translated = localized.lessons[j];
    if (!lessonNotes[lesson.slug]) throw new Error(`Missing English lesson notes: ${lesson.slug}`);
    const original = await readFile(`content/lessons/${m.slug}/${lesson.slug}.md`, 'utf8');
    const examples = [...original.matchAll(/```([^\n]*)\n([\s\S]*?)```/g)].map((match,k) => {
      const language = match[1].split(/\s/)[0];
      return `### Example ${k+1}\n\n\`\`\`${language} title="Example ${k+1}"\n${match[2]}\`\`\``;
    });
    const body = `${lessonNotes[lesson.slug]}\n\n## Code and configuration examples\n\nWork through these examples with the concepts above. Run them in your own project to check the behavior.\n\n${examples.join('\n\n')}\n\n## Put it into practice\n\n${translated.practice.task}\n\nExpected result: ${translated.practice.proof}\n`;
    await write(`.generated/en/lessons/${m.slug}/${lesson.slug}.md`, body);
  }
}
console.log(`Generated English routes, ${modules.length} modules, and ${modules.reduce((n,m)=>n+m.lessons.length,0)} lessons.`);
