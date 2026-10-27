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

test('each block sits in the tab of the heading above it, in order', async () => {
  const { chapters } = await data();
  for (const chapter of chapters.filter(item => item.tabs)) {
    // Expected split, walked independently over the full chapter HTML.
    const entry = urlMap.pages.find(page => page.chapter === chapter.id);
    const headings = new Set(chapter.outline.map(line => line.id));
    const expected = new Map(chapter.tabs.map(tab => [tab.id, []]));
    let tab = entry.lead;
    const hero = new Set(ids(chapter.heading));
    for (const id of ids(chapter.html)) {
      if (hero.has(id)) continue;
      if (headings.has(id)) tab = entry.anchors[id];
      expected.get(tab).push(id);
    }
    for (const item of chapter.tabs) assert.deepEqual(ids(item.html).filter(id => !id.includes(`${chapter.id}-overview-`)), expected.get(item.id), `${chapter.id}/${item.id}`);
  }
  const first = chapters.find(item => item.id === 'ch-01');
  const lead = ids(first.html).find(id => !ids(first.heading).includes(id));
  assert.equal(lead, 'ch-01-b002');
  assert.ok(first.tabs.find(item => item.id === urlMap.pages.find(page => page.chapter === 'ch-01').lead).html.includes(`id="${lead}"`));
});

test('search entries of tabbed chapters carry their tab', async () => {
  const { chapters, search } = await data();
  const tabbed = new Set(chapters.filter(chapter => chapter.tabs).map(chapter => chapter.id));
  const entries = search.filter(entry => tabbed.has(entry.chapter));
  assert.ok(entries.length > 200);
  for (const entry of entries) assert.ok(['overview', 'how-it-works', 'apply', 'check'].includes(entry.tab), entry.id);
  const anchors = Object.fromEntries(urlMap.pages.filter(page => page.tabs).flatMap(page => Object.entries(page.anchors)));
  for (const entry of entries.filter(item => item.type === 'заголовок')) if (anchors[entry.id]) assert.equal(entry.tab, anchors[entry.id], entry.id);
  assert.ok(search.filter(entry => !tabbed.has(entry.chapter)).every(entry => entry.tab === undefined));
  assert.equal(search.find(entry => entry.id === 'ch-08-8-3-fail-closed').tab, 'how-it-works');
  assert.equal(search.find(entry => entry.id === 'ch-08').tab, 'overview');
});

test('an overview compiles through the same pipeline and opens the chapter', async () => {
  const { chapters, search, audit } = await data();
  const chapter = chapters.find(item => item.id === 'ch-08');
  assert.deepEqual(chapter.overview, { title: 'Тестовый обзор главы 08', minutes: 3, ruleStrength: 'MUST' });
  const overview = chapter.tabs.find(tab => tab.id === 'overview').html;
  assert.match(overview, /^<h2 id="ch-08-overview-зачем">Зачем<\/h2>/);
  assert.ok(overview.includes('id="ch-08-overview-правило"'));
  assert.match(overview, /<a [^>]*href="\/reference\/glossary#term-[^"]+"[^>]*class="term-link"/);
  assert.ok(overview.includes('class="code-shell"'));
  assert.ok(!overview.includes('class="permalink"'));
  assert.ok(search.some(entry => entry.id.startsWith('ch-08-overview-') && entry.tab === 'overview' && entry.text.includes('preflight')));
  // The first paragraph (Зачем) is its own block with a glossary link and a search entry.
  assert.match(overview, /<p id="ch-08-overview-b001">(?:(?!<\/p>)[\s\S])*class="term-link"/);
  assert.ok(search.some(entry => entry.id === 'ch-08-overview-b001' && entry.tab === 'overview'));
  assert.equal(audit.tabs.overviews, 1);
  assert.equal(audit.unexplainedGaps, 0);
  assert.equal(chapters.filter(item => item.overview).length, 1);
  assert.ok(chapters.filter(item => item.tabs && item.id !== 'ch-08').every(item => item.overview === null && item.tabs[0].html === ''));
});

test('an overview may link to its own sections', async () => {
  const linked = fixture.replace('Начать правки до проверки.', 'Начать правки до проверки, см. [Правило](#ch-08-overview-правило).');
  const { chapters, anchors } = await compileHandbook(source, { urlMap, overviews: { '08': linked } });
  const chapter = chapters.find(item => item.id === 'ch-08');
  assert.ok(chapter.tabs.find(tab => tab.id === 'overview').html.includes(`href="${chapter.href}#${encodeURIComponent('ch-08-overview-правило')}"`));
  assert.equal(anchors['ch-08-overview-правило'], undefined);
  const missing = fixture.replace('Начать правки до проверки.', 'См. [нет](#ch-08-overview-нет).');
  await assert.rejects(() => compileHandbook(source, { urlMap, overviews: { '08': missing } }), /Missing anchor ch-08-overview-нет/);
});

test('reader assets put the static diagrams into the tabs too', () => {
  const generated = JSON.parse(fs.readFileSync(`${root}src/content/generated.json`, 'utf8'));
  let figures = 0;
  for (const chapter of generated.chapters.filter(item => item.tabs)) for (const tab of chapter.tabs) {
    for (const [figure] of tab.html.matchAll(/<figure[^>]*data-diagram="[^"]+"[^>]*>/g)) {
      figures++;
      assert.ok(chapter.html.includes(figure), `${chapter.id}/${tab.id}: ${figure}`);
    }
  }
  assert.ok(figures > 0);
  assert.equal(figures, generated.chapters.filter(item => item.tabs).reduce((sum, item) => sum + [...item.html.matchAll(/data-diagram="/g)].length, 0));
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
    ['rule without quote', swap('> Агент начинает', 'Агент начинает'), /needs the rule as one quote/],
    ['four steps', swap('3. Записать base SHA.', '3. Записать base SHA.\n4. Ещё шаг.'), /one numbered list of 3 items/],
    ['bullets', swap('1. Открыть', '- Открыть').replace('2. Проверить', '- Проверить').replace('3. Записать', '- Записать'), /one numbered list of 3 items/],
    ['raw HTML', swap('Начать правки до проверки.', '<details>Начать</details>'), /raw HTML/],
    ['too long', swap('Начать правки до проверки.', words), /words, at most 350/],
    ['two tables', swap('Начать правки до проверки.', '| a |\n|---|\n| b |\n\n| c |\n|---|\n| d |'), /2 tables/],
    ['empty section', swap('Начать правки до проверки.', ''), /«Частая ошибка» is empty/],
    ['empty rule', swap('> Агент начинает работу с preflight.', '>'), /«Правило» (is empty|needs the rule as one quote)/],
    ['two rules', swap('> Агент начинает работу с preflight.', '> Агент начинает работу с preflight.\n\n> Ещё правило.'), /needs the rule as one quote/],
    ['text beside steps', swap('1. Открыть', 'Шаги:\n\n1. Открыть'), /one numbered list of 3 items/],
    ['repeated key', swap('minutes: 3', 'minutes: 3\nminutes: 5'), /key minutes is repeated/],
    ['single quotes', swap('title: "Тестовый обзор главы 08"', "title: 'Тестовый обзор главы 08'"), /frontmatter line/],
    ['open quote', swap('title: "Тестовый обзор главы 08"', 'title: "Тестовый обзор главы 08'), /frontmatter line/],
    ['two diagrams', swap('Начать правки до проверки.', '```mermaid\nA-->B\n```\n\n```mermaid\nC-->D\n```'), /2 diagrams/],
  ];
  for (const [name, broken, expected] of cases) assert.throws(() => parseOverview('08', broken), expected, name);
  assert.doesNotThrow(() => parseOverview('08', fixture));
  assert.deepEqual(parseOverview('08', `\uFEFF${fixture.replace(/\n/g, '\r\n')}`).meta, parseOverview('08', fixture).meta);
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
  // The map changes no text: with no chapter live, not even a link.
  const unlive = structuredClone(urlMap);
  for (const entry of unlive.pages) delete entry.live;
  assert.equal(plain.html, (await compileHandbook(source, { urlMap: unlive, overviews: { '08': fixture } })).html);
});

test('a live chapter is read at its tab addresses: anchors, links and search', async () => {
  const { chapters, anchors, search } = await data();
  const chapter = chapters.find(item => item.id === 'ch-08');
  const tabPath = { overview: '/flow/08-preflight', 'how-it-works': '/flow/08-preflight/how-it-works', apply: '/flow/08-preflight/apply', check: '/flow/08-preflight/check' };
  assert.equal(chapter.path, '/chapters/08');
  assert.equal(chapter.href, '/flow/08-preflight');
  // Pages without tabs that moved (P2-05b) are read at their new address; the rest stay where they are.
  const moved = { 'ch-22': '/reference/22-cheatsheet', 'ch-23': '/reference/glossary' };
  assert.ok(chapters.filter(item => item.id !== 'ch-08').every(item => item.href === (moved[item.id] ?? item.path)));
  // Every id of the chapter is registered at the tab that holds it, the heading at the overview.
  const holder = new Map([...ids(chapter.heading).map(id => [id, 'overview']), ...chapter.tabs.flatMap(tab => ids(tab.html).map(id => [id, tab.id]))]);
  for (const id of ids(chapter.html)) assert.equal(anchors[id].path, tabPath[holder.get(id)], id);
  assert.equal(anchors['ch-08'].path, tabPath.overview);
  assert.equal(anchors['ch-08-8-2-отчет-preflight'].path, tabPath.apply);
  assert.equal(anchors['ch-08-8-3-fail-closed'].path, tabPath['how-it-works']);
  // Links to the chapter, from it and from other chapters, go to the tab of their target.
  const all = [...chapters.map(item => item.html), ...chapters.flatMap(item => item.tabs?.map(tab => tab.html) ?? [])].join('');
  const links = [...all.matchAll(/href="([^"#]*)#(ch-08[^"]*)"/g)];
  assert.ok(links.length > 3);
  for (const [, path, target] of links) {
    const id = decodeURIComponent(target);
    assert.equal(path, id.startsWith('ch-08-overview-') ? tabPath.overview : tabPath[holder.get(id)], id);
  }
  assert.ok(!all.includes('href="/chapters/08'));
  // Search: every entry of the chapter opens its tab, the overview layer included.
  const entries = search.filter(entry => entry.chapter === 'ch-08');
  assert.ok(entries.some(entry => entry.id.startsWith('ch-08-overview-')));
  for (const entry of entries) assert.equal(entry.path, tabPath[entry.tab], entry.id);
});

test('an overview example is shown open, not as a deep dive', async () => {
  const { chapters } = await data();
  const overview = chapters.find(item => item.id === 'ch-08').tabs.find(tab => tab.id === 'overview').html;
  const example = overview.match(/<div id="ch-08-overview-b\d{3}" class="overview-example">[\s\S]*?<\/pre><\/div><\/div>/);
  assert.ok(example, 'overview example');
  assert.doesNotMatch(example[0], /<details|<summary/);
  assert.match(example[0], /data-copy="ch-08-overview-b\d{3}"/);
  // The chapter text keeps its deep dives.
  assert.match(chapters.find(item => item.id === 'ch-08').tabs.find(tab => tab.id === 'apply').html, /<details[^>]*class="deep-dive"/);
});
