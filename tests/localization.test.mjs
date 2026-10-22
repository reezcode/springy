import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { modules as idModules } from '../content/index.ts';
import { modules as enModules, getLessonBody, buildSearchIndex } from '../.generated/en/content/index.ts';
import { gradeChoice, gradeCode, gradeFill, gradeOrder } from '../lib/grading.ts';
import { parseMarkdown } from '../lib/markdown.ts';

test('English curriculum covers every lesson and preserves progress and grading contracts', () => {
  assert.equal(enModules.length, idModules.length);
  for (const [i, en] of enModules.entries()) {
    const id = idModules[i];
    assert.equal(en.id, id.id);
    assert.equal(en.slug, id.slug);
    assert.equal(en.lessons.length, id.lessons.length);
    for (const [j,l] of en.lessons.entries()) {
      const original = id.lessons[j];
      assert.equal(l.id, original.id);
      assert.equal(l.slug, original.slug);
      assert.ok(l.title && l.summary && l.objectives.length >= 2 && l.keyPoints.length >= 3);
      const body = getLessonBody(en,l);
      const blocks = parseMarkdown(body);
      assert.ok(blocks.filter(b=>b.type==='heading').length >= 2);
      assert.ok(body.includes('## Put it into practice'));
      for (const [k,q] of l.exercises.entries()) {
        const before = original.exercises[k];
        assert.equal(q.id,before.id);
        assert.equal(q.kind,before.kind);
        assert.ok(q.prompt && q.explanation);
        if(q.kind==='choice') {
          assert.deepEqual(q.options.map(o=>!!o.correct),before.options.map(o=>!!o.correct));
          assert.ok(gradeChoice(q,q.options.flatMap((o,n)=>o.correct?[n]:[])).passed);
        }
        if(q.kind==='code') {
          assert.deepEqual(q.checks.map(c=>[c.pattern,c.flags,c.absent]),before.checks.map(c=>[c.pattern,c.flags,c.absent]));
          assert.equal(q.solution,before.solution);
          assert.ok(gradeCode(q,q.solution).passed,`${l.id}:${q.id}`);
          assert.ok(!gradeCode(q,q.starter).passed);
        }
        if(q.kind==='fill') {
          assert.deepEqual(q.answers,before.answers);
          for(const a of q.answers) assert.ok(gradeFill(q,a).passed);
        }
        if(q.kind==='order') {
          assert.equal(q.items.length,before.items.length);
          assert.ok(gradeOrder(q,q.items).passed);
          assert.ok(!gradeOrder(q,[...q.items].reverse()).passed);
        }
      }
    }
  }
});

test('English navigation and search stay in the English route tree',()=>{
  for(const entry of buildSearchIndex()) assert.match(entry.href,/^\/en\/modules\//);
  const nav=readFileSync('.generated/en/components/layout/nav-items.ts','utf8');
  assert.ok(nav.includes('/en/modules/'));
  assert.ok(nav.includes('/en/settings/'));
  assert.ok(!nav.includes("label: 'Beranda'"));
});
