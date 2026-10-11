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
  assert.equal(data.chapters.length, 27);
  assert.equal(data.chapters.filter(c=>/^ch-(0[1-9]|1\d|2[0-2])$/.test(c.id)).length,22);
  const resources=data.chapters.find(c=>c.id==='ch-resources');
  assert.equal(resources.path,'/resources');
  assert.equal(resources.outline.length,6);
  assert.ok(data.search.some(e=>e.path==='/resources'&&e.text.includes('How I use LLMs')));
  assert.equal((resources.html.match(/href="https:\/\//g)??[]).length,29);
  assert.ok(!resources.html.includes('<iframe'));
  for(const [id,path]of [['ch-tools','/tools'],['ch-codex','/tools/codex'],['ch-claude-code','/tools/claude-code']]){
    const page=data.chapters.find(c=>c.id===id);assert.ok(page,id);assert.equal(page.path,path);assert.equal(data.anchors[id].path,path);
    assert.ok(data.search.some(entry=>entry.chapter===id&&entry.path===path));
    assert.ok(page.html.includes('11 октября 2026'));
  }
  assert.equal((data.chapters.find(c=>c.id==='ch-tools').html.match(/class="route-chapter tool-card"/g)??[]).length,2);
  assert.ok(data.search.some(entry=>entry.path==='/tools/codex'&&entry.text.includes('Ultrafast')));
  assert.ok(data.search.some(entry=>entry.path==='/tools/claude-code'&&entry.text.includes('/verify')));
  for(const id of ['ch-codex','ch-claude-code'])assert.ok(data.chapters.find(c=>c.id===id).html.includes('content-detail'));
  assert.ok(data.chapters.find(c=>c.id==='ch-02').html.includes('Evidence для узлов карты'));
  assert.ok(!data.html.includes('<!--'));
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
test('tool feature screenshots have verified sources, intrinsic dimensions and exact asset bytes', async () => {
  const { compileHandbook } = await import(modulePath.href);
  const source = fs.readFileSync(new URL('../content/handbook.md', import.meta.url), 'utf8');
  const data = await compileHandbook(source);
  const media = JSON.parse(fs.readFileSync(new URL('../src/content/tool-media.json', import.meta.url), 'utf8'));
  for (const [id, required] of [['ch-codex', ['Dots', 'Appshots', 'Security Cloud']], ['ch-claude-code', ['Mods', 'Artifacts']]]) {
    const html = data.chapters.find(chapter => chapter.id === id).html;
    for (const name of required) assert.ok(html.includes(name), name);
    const images = [...html.matchAll(/<img\b([^>]*loading="lazy"[^>]+)>/g)];
    assert.ok(images.length >= 10, `${id}: feature coverage`);
    assert.equal((html.match(/<figcaption\b/g) ?? []).length, images.length);
    assert.ok((html.match(/class="feature-facts"/g) ?? []).length >= 10);
    for (const [, attributes] of images) {
      const src = attributes.match(/src="([^"]+)"/)[1];
      const entry = media[src];
      assert.ok(entry?.width > 0 && entry?.height > 0, src);
      assert.match(attributes, /loading="lazy"/);
      assert.match(attributes, /decoding="async"/);
      assert.ok(attributes.includes(`width="${entry.width}"`) && attributes.includes(`height="${entry.height}"`));
      assert.ok(attributes.match(/alt="([^"]+)"/)[1].length > 15);
      assert.match(entry.docUrl, /^https:\/\/(learn\.chatgpt\.com|code\.claude\.com|claude\.com|support\.claude\.com)\//);
      assert.equal(entry.verifiedAt, '2026-10-11');
      assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(`../public${src}`, import.meta.url))).digest('hex'), entry.sha256, src);
    }
  }
});
test('appendix is rejected rather than published', async () => {
  const { compileHandbook } = await import(modulePath.href);
  await assert.rejects(() => compileHandbook('**Конец учебного руководства.**\nimplementation brief'), /appendix/i);
});
test('official product marks preserve original bytes and consistent decorative dimensions', async () => {
  const {compileHandbook}=await import(modulePath.href);
  const source=fs.readFileSync(new URL('../content/handbook.md',import.meta.url),'utf8');
  const data=await compileHandbook(source);
  const sources=JSON.parse(fs.readFileSync(new URL('../docs/product-logo-sources.json',import.meta.url),'utf8'));
  const {termProduct}=await import(new URL('../src/design/product-logos.mjs',import.meta.url));
  for(const asset of sources){
    assert.ok(asset.verifiedSource,asset.id);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(`../public${asset.src}`,import.meta.url))).digest('hex'),asset.sha256,asset.id);
    if(asset.src.endsWith('.svg'))assert.ok(!/<script|<foreignObject|\bon\w+=|href="https?:/i.test(fs.readFileSync(new URL(`../public${asset.src}`,import.meta.url),'utf8')),asset.id);
  }
  for(const [,attributes]of data.html.matchAll(/<img\b([^>]*class="product-mark[^>]+)>/g)){
    assert.ok(attributes.includes(attributes.includes('product-wordmark')?'width="83"':'width="20"')&&attributes.includes('height="20"')&&attributes.includes('alt=""')&&attributes.includes('aria-hidden="true"'));
  }
  assert.equal(termProduct('term-founder'),undefined);
  assert.equal(termProduct('term-corepack'),undefined);
  assert.equal(termProduct('term-devcontainer'),undefined);
  const editorLinks=[...data.html.matchAll(/<a[^>]+href="[^"]*#term-vscode"[^>]*>([\s\S]*?)<\/a>/g)].map(match=>match[1]).filter(html=>/^редактор$/i.test(html.replace(/<[^>]*>/g,'').trim()));
  assert.ok(editorLinks.length>0);
  for(const html of editorLinks)assert.ok(!html.includes('product-mark'));
  for(const id of ['ch-codex','ch-claude-code'])assert.match(data.chapters.find(c=>c.id===id).html,/<h2[^>]*><img[^>]+class="product-mark/);
  for(const id of ['term-linear','term-github','term-figma','term-docker','term-node']){
    const term=data.terms.find(t=>t.id===id);assert.ok(term.definitionHtml.includes('product-mark'),id);
  }
});
test('matcher respects longest phrase, Unicode boundaries and case-sensitive short aliases', async () => {
  const { makeMatcher } = await import(modulePath.href);
  const terms = [{id:'term-git',label:'Git',aliases:[]},{id:'term-github',label:'GitHub',aliases:[]},{id:'term-pr',label:'Pull Request',aliases:['PR']}];
  const match = makeMatcher(terms);
  assert.deepEqual(match('GitHub, Git; PR. spring pr').map(x => x.id), ['term-github','term-git','term-pr']);
});
