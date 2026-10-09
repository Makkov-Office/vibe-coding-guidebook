import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const modulePath = new URL('../src/content/compiler.mjs', import.meta.url);
test('content compiler exists', () => assert.ok(fs.existsSync(modulePath), 'build-time content compiler must exist'));
test('source boundary, full inventory and safe rendering', async () => {
  const { compileHandbook } = await import(modulePath.href);
  const source = fs.readFileSync(new URL('../content/handbook.md', import.meta.url), 'utf8');
  const originalPath = new URL('../../2 - agentic-engineering-handbook.md', import.meta.url);
  if (fs.existsSync(originalPath)) {
    const original = fs.readFileSync(originalPath, 'utf8');
    const hashes=JSON.parse(fs.readFileSync(new URL('../docs/original-source-hashes.json',import.meta.url),'utf8'));
    assert.equal(crypto.createHash('sha256').update(original).digest('hex'),hashes['2 - agentic-engineering-handbook.md']);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../../1 - codex-implementation-prompt.md',import.meta.url))).digest('hex'),hashes['1 - codex-implementation-prompt.md']);
  }
  assert.equal(source, fs.readFileSync(new URL('../public/handbook.md', import.meta.url), 'utf8'));
  const data = await compileHandbook(source);
  assert.equal(data.chapters.length, 24);
  assert.equal(data.chapters.filter(c=>/^ch-(0[1-9]|1\d|2[0-2])$/.test(c.id)).length,22);
  const resources=data.chapters.find(c=>c.id==='ch-resources');
  assert.equal(resources.path,'/resources');
  assert.equal(resources.outline.length,6);
  assert.ok(data.search.some(e=>e.path==='/resources'&&e.text.includes('How I use LLMs')));
  assert.equal((resources.html.match(/href="https:\/\//g)??[]).length,29);
  assert.ok(!resources.html.includes('<iframe'));
  assert.equal(data.terms.length, 394);
  assert.equal(data.topics.length, 11);
  assert.equal(data.diagrams.length, 6);
  assert.equal(data.audit.unexplainedGaps, 0);
  assert.equal(data.audit.ambiguous.length, 0);
  assert.ok(data.audit.linked > 500);
  assert.ok(!JSON.stringify(data).includes('## 17. README и handoff'));
  const ids = [...data.html.matchAll(/ id="([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, path,target] of data.html.matchAll(/href="([^"#]*)#([^"]+)"/g)) assert.equal(data.anchors[target].path,path,target);
  assert.ok(!/AI Artefacts|ai-artefacts|chatgpt-conversation:|PR #\d|TICKET-\d/.test(JSON.stringify(data)));
  assert.equal(data.blocks.filter(b=>b.adjacent).length,2);
  assert.ok(data.terms.every(t=>t.definitionHtml&&['tooltip','popover'].includes(t.previewKind)));
  const products=data.terms.filter(t=>t.previewKind==='popover');
  assert.equal(products.length,23);
  for(const term of products){assert.match(term.definitionHtml,/href="https:\/\//);assert.match(term.definitionHtml,/target="_blank"/);assert.match(term.definitionHtml,/rel="noopener noreferrer"/);assert.ok(!term.definitionHtml.includes('class="term-link"'));assert.ok(data.chapters.find(c=>c.id==='ch-23').html.includes(term.definitionHtml));}
  assert.equal(data.terms.find(t=>t.id==='term-founder').previewKind,'tooltip');
  assert.equal(data.terms.find(t=>t.id==='term-repository').previewKind,'tooltip');
  assert.ok(!data.html.includes('<script'));
  assert.ok(!data.html.includes('javascript:'));
  assert.ok(data.blocks.every(b => source.includes(b.raw)));
});
test('preview threshold and structural classification',async()=>{const {previewKind}=await import(modulePath.href);assert.equal(previewKind('я'.repeat(160)),'tooltip');assert.equal(previewKind('я'.repeat(161)),'panel');assert.equal(previewKind('short',true),'panel');assert.equal(previewKind('  one   paragraph  '),'tooltip');assert.equal(previewKind('я'.repeat(160),false,true),'popover');assert.equal(previewKind('я'.repeat(161),false,true),'panel');assert.equal(previewKind('short',true,true),'panel');});
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
