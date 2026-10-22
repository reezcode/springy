// Verifies curriculum integrity and that every exercise is gradeable:
// reference solutions must pass, starters must fail, answers must be consistent.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { modules, lessons, sources, getLessonBody } from '../content/index.ts';
import { gradeChoice, gradeCode, gradeFill, gradeOrder } from '../lib/grading.ts';
import { parseMarkdown } from '../lib/markdown.ts';

const sourceIds = new Set(sources.map((s) => s.id));

test('module and lesson slugs are unique and url-safe', () => {
  const slugs = modules.map((m) => m.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'duplicate module slug');
  for (const m of modules) {
    assert.match(m.slug, /^[a-z0-9-]+$/);
    const ls = m.lessons.map((l) => l.slug);
    assert.equal(new Set(ls).size, ls.length, `duplicate lesson slug in ${m.slug}`);
    for (const l of m.lessons) assert.match(l.slug, /^[a-z0-9-]+$/, l.slug);
  }
});

test('every lesson has a markdown body with sections', () => {
  for (const m of modules) {
    for (const l of m.lessons) {
      const file = join('content', 'lessons', m.slug, `${l.slug}.md`);
      assert.ok(existsSync(file), `missing ${file}`);
      const blocks = parseMarkdown(getLessonBody(m, l));
      assert.ok(blocks.filter((b) => b.type === 'heading' && b.level === 2).length >= 2, `${file}: needs at least two ## sections`);
      for (const b of blocks) if (b.type === 'code') assert.ok(b.code.trim(), `${file}: empty code block`);
    }
  }
});

test('lesson metadata is complete and references exist', () => {
  for (const l of lessons) {
    assert.ok(l.title && l.summary, l.id);
    assert.ok(l.minutes > 0, `${l.id} minutes`);
    assert.ok(l.objectives.length >= 2, `${l.id} objectives`);
    assert.ok(l.keyPoints.length >= 3, `${l.id} keyPoints`);
    assert.ok(l.practice.task && l.practice.proof, `${l.id} practice`);
    assert.ok(l.refs.length >= 1, `${l.id} refs`);
    for (const r of l.refs) assert.ok(sourceIds.has(r.source), `${l.id}: unknown source ${r.source}`);
    assert.ok(l.exercises.length >= 2, `${l.id}: needs at least two exercises`);
    const ids = l.exercises.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length, `${l.id}: duplicate exercise id`);
    for (const id of ids) assert.match(id, /^[a-z0-9-]{1,40}$/, `${l.id}: bad exercise id ${id}`);
  }
});

test('every exercise is consistent and gradeable', () => {
  for (const l of lessons) {
    for (const e of l.exercises) {
      const where = `${l.id}:${e.id}`;
      assert.ok(e.prompt && e.explanation, `${where}: prompt/explanation`);
      if (e.kind === 'choice') {
        const correct = e.options.flatMap((o, i) => (o.correct ? [i] : []));
        assert.ok(e.options.length >= 3, `${where}: at least 3 options`);
        assert.ok(e.multiple ? correct.length >= 1 : correct.length === 1, `${where}: wrong number of correct options`);
        assert.ok(gradeChoice(e, correct).passed, `${where}: correct set should pass`);
        assert.ok(!gradeChoice(e, []).passed, `${where}: empty selection should fail`);
        const wrong = e.options.findIndex((o) => !o.correct);
        assert.ok(!gradeChoice(e, [wrong]).passed, `${where}: wrong option should fail`);
        for (const [i, o] of e.options.entries()) if (!o.correct) assert.ok(o.why, `${where}: option ${i} needs a "why"`);
      } else if (e.kind === 'fill') {
        assert.ok(e.answers.length >= 1, where);
        for (const a of e.answers) assert.ok(gradeFill(e, a).passed, `${where}: answer "${a}" should pass`);
        assert.ok(gradeFill(e, ` ${e.answers[0].toUpperCase()} `).passed, `${where}: grading should ignore case/space`);
        assert.ok(!gradeFill(e, 'jawaban salah').passed, `${where}: wrong answer should fail`);
        if (e.context) assert.ok(e.context.includes('___'), `${where}: context needs ___ blank`);
      } else if (e.kind === 'code') {
        assert.ok(e.checks.length >= 2, `${where}: at least two checks`);
        for (const c of e.checks) assert.doesNotThrow(() => new RegExp(c.pattern, c.flags ?? 'm'), `${where}: invalid regex ${c.pattern}`);
        const solution = gradeCode(e, e.solution);
        const failing = solution.checks.filter((c) => !c.ok).map((c) => c.label);
        assert.ok(solution.passed, `${where}: solution fails checks: ${failing.join(', ')}`);
        assert.ok(!gradeCode(e, e.starter).passed, `${where}: starter must not pass`);
      } else if (e.kind === 'order') {
        assert.ok(e.items.length >= 3, `${where}: at least 3 items`);
        assert.equal(new Set(e.items).size, e.items.length, `${where}: duplicate items`);
        assert.ok(gradeOrder(e, e.items).passed, where);
        assert.ok(!gradeOrder(e, [...e.items].reverse()).passed, where);
      } else {
        assert.fail(`${where}: unknown kind`);
      }
    }
  }
});

test('every source is cited by at least one lesson', () => {
  const cited = new Set(lessons.flatMap((l) => l.refs.map((r) => r.source)));
  const unused = sources.filter((s) => !cited.has(s.id)).map((s) => s.id);
  assert.deepEqual(unused, []);
});
