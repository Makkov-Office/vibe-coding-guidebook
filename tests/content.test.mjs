import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const modulePath = new URL('../src/content/compiler.mjs', import.meta.url);
test('content compiler exists', () => assert.ok(fs.existsSync(modulePath), 'build-time content compiler must exist'));
test('source boundary, full inventory and safe rendering', async () => {
  const { compileHandbook } = await import(modulePath.href);
  const source = fs.readFileSync(new URL('../content/handbook.md', import.meta.url), 'utf8');
  const originalPath = new URL('../../2 - agentic-engineering-handbook.md', import.meta.url);
  if (fs.existsSync(originalPath)) {
    const original = fs.readFileSync(originalPath, 'utf8');
    assert.equal(source, original.slice(0, original.indexOf('**Конец учебного руководства.**')).trimEnd()+'\n');
  }
  assert.equal(source, fs.readFileSync(new URL('../public/handbook.md', import.meta.url), 'utf8'));
  const data = await compileHandbook(source);
  assert.equal(data.chapters.length, 24);
  assert.equal(data.terms.length, 451);
  assert.equal(data.topics.length, 12);
  assert.equal(data.diagrams.length, 7);
  assert.equal(data.audit.unexplainedGaps, 0);
  assert.equal(data.audit.ambiguous.length, 0);
  assert.ok(data.audit.linked > 500);
  assert.ok(!JSON.stringify(data).includes('## 17. README и handoff'));
  const ids = [...data.html.matchAll(/ id="([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, target] of data.html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), target);
  assert.ok(!data.html.includes('<script'));
  assert.ok(!data.html.includes('javascript:'));
  assert.ok(data.blocks.every(b => source.includes(b.raw)));
});
test('appendix is rejected rather than published', async () => {
  const { compileHandbook } = await import(modulePath.href);
  await assert.rejects(() => compileHandbook('**Конец учебного руководства.**\nimplementation brief'), /appendix/i);
});
test('matcher respects longest phrase, Unicode boundaries and case-sensitive short aliases', async () => {
  const { makeMatcher } = await import(modulePath.href);
  const terms = [{id:'term-git',label:'Git',aliases:[]},{id:'term-github',label:'GitHub',aliases:[]},{id:'term-pr',label:'Pull Request',aliases:['PR']}];
  const match = makeMatcher(terms);
  assert.deepEqual(match('GitHub, Git; PR. spring pr').map(x => x.id), ['term-github','term-git','term-pr']);
});
