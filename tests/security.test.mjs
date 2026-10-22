import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { parseInline, parseMarkdown } from '../lib/markdown.ts';
import { sanitizeProgress, MAX_NOTE_LENGTH, MAX_IMPORT_LENGTH } from '../lib/progress/schema.ts';
import { progressActions } from '../lib/progress/store.ts';
import { gradeCode, MAX_CODE_LENGTH } from '../lib/grading.ts';
import { scriptSources } from '../scripts/security-headers.mjs';

test('markdown treats HTML and script URLs as inert text',()=>{
  const payload='<img src=x onerror=alert(1)><script>alert(1)</script>';
  const blocks=parseMarkdown(payload);
  assert.equal(blocks[0].type,'paragraph');
  assert.deepEqual(blocks[0].children,[{type:'text',value:payload}]);
  const inline=parseInline('[run](javascript:alert(1))');
  assert.ok(!inline.some(n=>n.type==='link'));
});

test('progress import rejects unsafe keys and bounds values without prototype pollution',()=>{
  const data=JSON.parse('{"version":2,"notes":{"__proto__":{"polluted":true},"m1-1":"ok","invalid":"bad"},"exercises":{"__proto__":{"passed":true},"m1-1:test":{"passed":true,"attempts":{"valueOf":1,"toString":1}}},"activity":{"2026-10-22":1e100}}');
  const result=sanitizeProgress(data);
  assert.deepEqual(result.notes,{'m1-1':'ok'});
  assert.equal(result.exercises['m1-1:test'].attempts,0);
  assert.equal(result.activity['2026-10-22'],1e6);
  assert.equal({}.polluted,undefined);
  assert.equal(sanitizeProgress({version:2,notes:{'m1-1':'x'.repeat(MAX_NOTE_LENGTH+1)}}).notes['m1-1'].length,MAX_NOTE_LENGTH);
  assert.equal(progressActions.importJson('x'.repeat(MAX_IMPORT_LENGTH+1)),false);
  assert.equal(progressActions.importJson('{invalid json}'),false);
});

test('code checking rejects oversized input before regex evaluation',()=>{
  const exercise={kind:'code',language:'java',checks:[{label:'test',pattern:'(a+)+$',hint:'hint'}]};
  const result=gradeCode(exercise,'a'.repeat(MAX_CODE_LENGTH+1)+'!');
  assert.equal(result.passed,false);
  assert.equal(result.checks[0].ok,false);
});

test('CSP hashes exact inline bytes without unsafe-inline or unsafe-eval script permissions',()=>{
  const script='window.example = "ok";\n';
  const sources=scriptSources(`<script>${script}</script><script src="/app.js"></script><script>${script}</script>`);
  assert.equal(sources,`'self' 'sha256-${createHash('sha256').update(script).digest('base64')}'`);
  assert.ok(!sources.includes('unsafe-inline'));
  assert.ok(!sources.includes('unsafe-eval'));
  assert.notEqual(scriptSources(`<script>${script} </script>`),sources);
});
