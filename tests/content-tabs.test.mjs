// P5-01: chapters split into 4 tabs by src/content/url-map.json, and the
// overview layer content/overview/NN.md (brief 8.1–8.2).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compileHandbook, parseOverview } from '../src/content/compiler.mjs';
import { loadUrlMap } from '../scripts/url-map.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = fs.readFileSync(`${root}content/handbook.md`, 'utf8');
const urlMap = loadUrlMap(root);
const fixture = fs.readFileSync(`${root}tests/fixtures/overview-08.md`, 'utf8');
const ids = html => [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
const text = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
let compiled;
const data = async () => compiled ??= await compileHandbook(source, { urlMap, overviews: { '08': fixture } });

test('every block of a tabbed chapter lands in exactly one tab, nothing is cut', async () => {
  const { chapters, audit } = await compileHandbook(source, { urlMap });
  const tabbed = chapters.filter(chapter => chapter.tabs);
  assert.deepEqual(tabbed.map(chapter => chapter.id), Array.from({ length: 21 }, (_, i) => `ch-${String(i + 1).padStart(2, '0')}`));
  assert.equal(audit.tabs.chapters, 21);
  for (const chapter of tabbed) {
    assert.deepEqual(chapter.tabs.map(tab => tab.id), ['overview', 'how-it-works', 'apply', 'check']);
    const parts = [chapter.heading, ...chapter.tabs.map(tab => tab.html)];
    const all = parts.flatMap(ids);
    assert.equal(all.length, new Set(all).size, `${chapter.id}: an id is in two tabs`);
    assert.deepEqual([...all].sort(), ids(chapter.html).sort(), `${chapter.id}: tabs differ from the chapter`);
    const words = html => text(html).split(' ').filter(Boolean).sort();
    assert.deepEqual(parts.flatMap(words).sort(), words(chapter.html), `${chapter.id}: text of the tabs differs from the chapter`);
    assert.deepEqual(chapter.tabs.flatMap(tab => tab.outline.map(line => line.id)).sort(), chapter.outline.map(line => line.id).sort(), chapter.id);
    const entry = urlMap.pages.find(page => page.chapter === chapter.id);
    for (const tab of chapter.tabs) for (const line of tab.outline) assert.equal(entry.anchors[line.id], tab.id, line.id);
    assert.match(chapter.heading, /^<h2 id="ch-\d{2}"/);
  }
  const chapter = id => chapters.find(item => item.id === id);
  assert.deepEqual(chapter('ch-07').tabs.find(tab => tab.id === 'check').panels, ['lifecycle']);
  assert.deepEqual(chapter('ch-02').tabs.find(tab => tab.id === 'check').panels, ['architecture']);
  assert.ok(chapter('ch-08').tabs.find(tab => tab.id === 'apply').html.includes('id="ch-08-8-2-отчет-preflight"'));
  assert.ok(chapter('ch-08').tabs.find(tab => tab.id === 'how-it-works').html.includes('id="ch-08-8-3-fail-closed"'));
  // A disclosure that wraps 9.2 stays whole inside its tab.
  assert.match(chapter('ch-09').tabs.find(tab => tab.id === 'apply').html, /<details class="deep-dive content-detail">[\s\S]*id="ch-09-9-2-пример-launcher-для-автора"/);
  for (const id of ['ch-00', 'ch-22', 'ch-23', 'ch-tools', 'ch-codex', 'ch-resources']) assert.equal(chapters.find(item => item.id === id)?.tabs, undefined, id);
});

test('search entries of tabbed chapters carry their tab', async () => {
  const { chapters, search } = await data();
  const tabbed = new Set(chapters.filter(chapter => chapter.tabs).map(chapter => chapter.id));
  const entries = search.filter(entry => tabbed.has(entry.chapter) && entry.id !== entry.chapter);
  assert.ok(entries.length > 200);
  for (const entry of entries) assert.ok(['overview', 'how-it-works', 'apply', 'check'].includes(entry.tab), entry.id);
  const anchors = Object.fromEntries(urlMap.pages.filter(page => page.tabs).flatMap(page => Object.entries(page.anchors)));
  for (const entry of entries.filter(item => item.type === 'заголовок')) if (anchors[entry.id]) assert.equal(entry.tab, anchors[entry.id], entry.id);
  assert.ok(search.filter(entry => !tabbed.has(entry.chapter)).every(entry => entry.tab === undefined));
  assert.equal(search.find(entry => entry.id === 'ch-08-8-3-fail-closed').tab, 'how-it-works');
});

test('an overview compiles through the same pipeline and opens the chapter', async () => {
  const { chapters, search, audit } = await data();
  const chapter = chapters.find(item => item.id === 'ch-08');
  assert.deepEqual(chapter.overview, { title: 'Тестовый обзор главы 08', minutes: 3, ruleStrength: 'MUST' });
  const overview = chapter.tabs.find(tab => tab.id === 'overview').html;
  assert.match(overview, /^<h2 id="ch-08-overview-зачем">Зачем<\/h2>/);
  assert.ok(overview.includes('id="ch-08-overview-правило"'));
  assert.match(overview, /<a [^>]*href="\/glossary#term-[^"]+"[^>]*class="term-link"/);
  assert.ok(overview.includes('class="code-shell"'));
  assert.ok(!overview.includes('class="permalink"'));
  assert.ok(search.some(entry => entry.id.startsWith('ch-08-overview-') && entry.tab === 'overview' && entry.text.includes('preflight')));
  assert.equal(audit.tabs.overviews, 1);
  assert.equal(audit.unexplainedGaps, 0);
  assert.equal(chapters.filter(item => item.overview).length, 1);
  assert.ok(chapters.filter(item => item.tabs && item.id !== 'ch-08').every(item => item.overview === null && item.tabs[0].html === ''));
});

test('an overview that breaks the template fails the build', async () => {
  const swap = (from, to) => fixture.replace(from, to);
  const words = Array.from({ length: 340 }, () => 'слово').join(' ');
  const cases = [
    ['no frontmatter', fixture.replace(/^---[\s\S]*?---\n/, ''), /frontmatter is missing/],
    ['extra key', swap('minutes: 3', 'minutes: 3\nlevel: M1'), /frontmatter needs exactly/],
    ['missing key', swap('rule_strength: MUST\n', ''), /frontmatter needs exactly/],
    ['other chapter', swap('chapter: "08"', 'chapter: "09"'), /does not match the file name/],
    ['minutes', swap('minutes: 3', 'minutes: три'), /positive whole number/],
    ['rule strength', swap('rule_strength: MUST', 'rule_strength: ОБЯЗАТЕЛЬНО'), /MUST, SHOULD or MAY/],
    ['section renamed', swap('## Частая ошибка', '## Ошибки'), /sections must be exactly/],
    ['section order', swap('## Зачем', '## Правило').replace('## Правило\n>', '## Зачем\n>'), /sections must be exactly/],
    ['deeper heading', swap('Начать правки до проверки.', '### Подробнее\nНачать правки.'), /only ## sections/],
    ['rule without quote', swap('> Агент начинает', 'Агент начинает'), /needs the rule as a quote/],
    ['four steps', swap('3. Записать base SHA.', '3. Записать base SHA.\n4. Ещё шаг.'), /one numbered list of 3 items/],
    ['bullets', swap('1. Открыть', '- Открыть').replace('2. Проверить', '- Проверить').replace('3. Записать', '- Записать'), /one numbered list of 3 items/],
    ['raw HTML', swap('Начать правки до проверки.', '<details>Начать</details>'), /raw HTML/],
    ['too long', swap('Начать правки до проверки.', words), /words, at most 350/],
    ['two tables', swap('Начать правки до проверки.', '| a |\n|---|\n| b |\n\n| c |\n|---|\n| d |'), /2 tables/],
    ['two diagrams', swap('Начать правки до проверки.', '```mermaid\nA-->B\n```\n\n```mermaid\nC-->D\n```'), /2 diagrams/],
  ];
  for (const [name, broken, expected] of cases) assert.throws(() => parseOverview('08', broken), expected, name);
  assert.doesNotThrow(() => parseOverview('08', fixture));
  await assert.rejects(() => compileHandbook(source, { urlMap, overviews: { 22: fixture.replace('"08"', '"22"') } }), /not a chapter with tabs/);
});

test('the split fails closed on a heading without a tab or a disclosure across tabs', async () => {
  const broken = structuredClone(urlMap);
  delete broken.pages.find(page => page.chapter === 'ch-08').anchors['ch-08-8-3-fail-closed'];
  await assert.rejects(() => compileHandbook(source, { urlMap: broken }), /ch-08: heading ch-08-8-3-fail-closed has no tab/);
  const spanning = source.replace('### 8.2.', '<!-- details: Тест -->\n\n### 8.2.').replace('\n## 09.', '\n<!-- /details -->\n\n## 09.');
  await assert.rejects(() => compileHandbook(spanning, { urlMap }), /ch-08: block .* belongs to (apply and how-it-works|how-it-works and apply)/);
});

test('without the map the compiler output has no tabs (old callers)', async () => {
  const plain = await compileHandbook(source);
  assert.ok(plain.chapters.every(chapter => chapter.tabs === undefined));
  assert.ok(plain.search.every(entry => entry.tab === undefined));
  const full = await data();
  assert.equal(plain.html, full.html);
});
