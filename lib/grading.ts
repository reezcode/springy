import type { ChoiceExercise, CodeExercise, FillExercise, OrderExercise } from '../content/types.ts';

/**
 * Pure grading functions. No React, no DOM: the same code runs in the UI and
 * in tests/grading.test.mjs, which also verifies every exercise in the
 * curriculum (reference solutions must pass, starters must fail).
 */

export type CheckResult = { label: string; ok: boolean; hint: string };
export type GradeResult = { passed: boolean; checks?: CheckResult[] };

export function gradeChoice(exercise: ChoiceExercise, selected: number[]): GradeResult {
  const picked = new Set(selected);
  const passed = exercise.options.every((option, i) => Boolean(option.correct) === picked.has(i));
  return { passed };
}

/** Lower-case, trim, collapse whitespace and drop spaces around punctuation. */
export function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*([(){}\[\]<>,;:=.@/-])\s*/g, '$1');
}

export function gradeFill(exercise: FillExercise, input: string): GradeResult {
  const value = normalizeAnswer(input);
  return { passed: value !== '' && exercise.answers.some((answer) => normalizeAnswer(answer) === value) };
}

/**
 * Remove comments so that checks cannot be satisfied by commented-out code.
 * String literals are kept intact (checks may look for messages), and comment
 * markers inside strings are ignored.
 */
export function stripComments(source: string, language: CodeExercise['language']) {
  if (language === 'java') return stripCStyleComments(source);
  if (language === 'yaml' || language === 'dockerfile' || language === 'shell') {
    return source
      .split('\n')
      .map((line) => stripHashComment(line))
      .join('\n');
  }
  return source;
}

function stripCStyleComments(source: string) {
  let out = '';
  let i = 0;
  let quote: string | null = null;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      i++;
      continue;
    }
    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      out += ' ';
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function stripHashComment(line: string) {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    // A hash only starts a comment at line start or after whitespace (e.g. not in URLs like a#b).
    else if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i).trimEnd();
  }
  return line;
}

export const MAX_CODE_LENGTH = 50_000;

export function gradeCode(exercise: CodeExercise, source: string): GradeResult {
  if (source.length > MAX_CODE_LENGTH) {
    return { passed: false, checks: exercise.checks.map(c => ({ label: c.label, ok: false, hint: "Jawaban terlalu panjang. Batasi kode hingga 50.000 karakter." })) };
  }
  const code = stripComments(source, exercise.language);
  const checks = exercise.checks.map((check) => {
    let found = false;
    try {
      found = new RegExp(check.pattern, check.flags ?? 'm').test(code);
    } catch {
      found = false;
    }
    return { label: check.label, ok: check.absent ? !found : found, hint: check.hint };
  });
  return { passed: checks.every((c) => c.ok), checks };
}

export function gradeOrder(exercise: OrderExercise, order: string[]): GradeResult {
  return { passed: order.length === exercise.items.length && order.every((item, i) => item === exercise.items[i]) };
}

/**
 * Deterministic shuffle (seeded by exercise id) so server and client render
 * the same initial order and hydration stays stable. Never returns the
 * solved order for lists with more than one item.
 */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const random = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out.every((item, i) => item === items[i])) out.push(out.shift() as T);
  return out;
}
