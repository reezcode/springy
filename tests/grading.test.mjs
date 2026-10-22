import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gradeChoice, gradeCode, gradeFill, gradeOrder, normalizeAnswer, seededShuffle, stripComments } from '../lib/grading.ts';
import { currentStreak, mergeProgress, sanitizeProgress, EMPTY_PROGRESS } from '../lib/progress/schema.ts';
import { lessonStatus, nextLessonId, overallStatus } from '../lib/progress/selectors.ts';
import { parseInline, parseMarkdown } from '../lib/markdown.ts';

test('choice grading requires the exact correct set', () => {
  const ex = { kind: 'choice', id: 'x', prompt: '', explanation: '', multiple: true, options: [{ text: 'a', correct: true }, { text: 'b' }, { text: 'c', correct: true }] };
  assert.ok(gradeChoice(ex, [0, 2]).passed);
  assert.ok(gradeChoice(ex, [2, 0]).passed);
  assert.ok(!gradeChoice(ex, [0]).passed);
  assert.ok(!gradeChoice(ex, [0, 1, 2]).passed);
});

test('fill grading normalises case and whitespace', () => {
  const ex = { kind: 'fill', id: 'x', prompt: '', explanation: '', answers: ['Optional.empty()'] };
  assert.ok(gradeFill(ex, '  optional.EMPTY( ) ').passed);
  assert.ok(gradeFill(ex, 'Optional . empty()').passed);
  assert.ok(!gradeFill(ex, '').passed);
  assert.ok(!gradeFill(ex, 'Optional.of(null)').passed);
  assert.equal(normalizeAnswer('  @Transactional  '), '@transactional');
});

test('code grading ignores comments but not strings', () => {
  const java = 'int a = 1; // private final int b;\n/* private final int c; */ String s = "// not a comment";';
  const stripped = stripComments(java, 'java');
  assert.ok(!stripped.includes('private final'));
  assert.ok(stripped.includes('"// not a comment"'));
  const ex = { kind: 'code', id: 'x', prompt: '', explanation: '', language: 'java', starter: '', solution: '', checks: [
    { label: 'has final', pattern: String.raw`private\s+final`, hint: '' },
    { label: 'no setter', pattern: String.raw`setTotal`, absent: true, hint: '' },
  ] };
  assert.ok(!gradeCode(ex, '// private final int x;').passed, 'commented code must not pass');
  assert.ok(gradeCode(ex, 'private final int x;').passed);
  assert.ok(!gradeCode(ex, 'private final int x; void setTotal() {}').passed);
  assert.equal(stripComments('image: app # tag\nurl: http://x/#a', 'yaml'), 'image: app\nurl: http://x/#a');
});

test('order grading and deterministic shuffle', () => {
  const ex = { kind: 'order', id: 'steps', prompt: '', explanation: '', items: ['a', 'b', 'c', 'd'] };
  assert.ok(gradeOrder(ex, ['a', 'b', 'c', 'd']).passed);
  assert.ok(!gradeOrder(ex, ['b', 'a', 'c', 'd']).passed);
  const s1 = seededShuffle(ex.items, 'steps');
  assert.deepEqual(s1, seededShuffle(ex.items, 'steps'), 'same seed, same order');
  assert.notDeepEqual(s1, ex.items, 'never returns the solved order');
  assert.deepEqual([...s1].sort(), ex.items);
});

test('progress sanitising, v1 migration and merge', () => {
  assert.equal(sanitizeProgress(null), null);
  assert.equal(sanitizeProgress({ foo: 1 }), null);
  const v1 = sanitizeProgress({ done: ['m1-1', 'bad', 'm2-3'], notes: { 'm1-1': 'catatan', x: 'y' }, last: 'm1', days: {} });
  assert.deepEqual(v1.practiced, ['m1-1', 'm2-3']);
  assert.deepEqual(v1.notes, { 'm1-1': 'catatan' });
  const v2 = sanitizeProgress({ version: 2, exercises: { 'm1-1:a': { passed: true, attempts: 2, updatedAt: 't' }, 'evil key': { passed: true } }, practiced: [], notes: {}, lastLesson: 'm1-2', activity: { '2026-10-22': 2, nope: 1 } });
  assert.deepEqual(Object.keys(v2.exercises), ['m1-1:a']);
  assert.deepEqual(v2.activity, { '2026-10-22': 2 });
  const merged = mergeProgress({ ...EMPTY_PROGRESS, exercises: { 'm1-1:a': { passed: false, attempts: 5, updatedAt: 'a' } } }, v2);
  assert.equal(merged.exercises['m1-1:a'].passed, true, 'a pass is never lost on merge');
  assert.equal(merged.exercises['m1-1:a'].attempts, 5);
});

test('progress selectors', () => {
  const outline = [{ id: 'm1', lessons: [{ id: 'm1-1', exerciseIds: ['a', 'b'] }, { id: 'm1-2', exerciseIds: ['c'] }] }];
  const p = { ...EMPTY_PROGRESS, exercises: { 'm1-1:a': { passed: true, attempts: 1, updatedAt: '' }, 'm1-1:b': { passed: true, attempts: 3, updatedAt: '' } }, lastLesson: 'm1-1' };
  assert.equal(lessonStatus(p, outline[0].lessons[0]).complete, true);
  assert.equal(lessonStatus(p, outline[0].lessons[1]).complete, false);
  assert.equal(overallStatus(p, outline).percent, 50);
  assert.equal(nextLessonId(p, outline), 'm1-2');
});

test('streak counts consecutive days', () => {
  const today = new Date(2026, 9, 22);
  assert.equal(currentStreak({ '2026-10-22': 1, '2026-10-21': 2, '2026-10-19': 1 }, today), 2);
  assert.equal(currentStreak({ '2026-10-21': 1, '2026-10-20': 1 }, today), 2, 'streak survives until the day ends');
  assert.equal(currentStreak({}, today), 0);
});

test('markdown parser', () => {
  const blocks = parseMarkdown('## Judul A\n\nTeks `kode` dan **tebal**.\n\n- satu\n- dua\n\n```java title="A.java"\nclass A {}\n```\n\n> [!TIP] Saran\n> isi\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\n## Judul A');
  assert.deepEqual(blocks.map((b) => b.type), ['heading', 'paragraph', 'list', 'code', 'callout', 'table', 'heading']);
  assert.equal(blocks[0].id, 'judul-a');
  assert.equal(blocks[6].id, 'judul-a-2', 'duplicate headings get unique ids');
  assert.equal(blocks[3].title, 'A.java');
  assert.deepEqual(parseInline('[x](javascript:alert(1))'), [{ type: 'text', value: '[x](javascript:alert(1))' }], 'only http(s) links');
});
